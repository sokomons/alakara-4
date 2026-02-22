import express from 'express';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import supabase from './src/db.ts';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'school-secret-key';
const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json());

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  // WebSocket broadcast helper
  const broadcast = (data: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  };

  // Seed Super Admin
  const seedSuperAdmin = async () => {
    try {
      const { data: admin } = await supabase.from('app_users').select('*').eq('role', 'super_admin').maybeSingle();
      if (!admin) {
        const hashedPassword = bcrypt.hashSync('admin123', 10);
        await supabase.from('app_users').insert({ name: 'Super Admin', username: 'admin', password: hashedPassword, role: 'super_admin' });
        console.log('Super Admin seeded: admin / admin123');
      }
    } catch (e) {
      console.error('Error seeding super admin:', e);
    }
  };
  seedSuperAdmin();

  const seedSubjects = async () => {
    try {
      const { data: schools } = await supabase.from('schools').select('id');
      if (schools) {
        const defaultSubjects = ['Mathematics', 'English', 'Kiswahili', 'Science', 'Social Studies'];
        for (const school of schools) {
          for (const subjectName of defaultSubjects) {
            const { data: exists } = await supabase.from('subjects').select('id').eq('school_id', school.id).eq('name', subjectName).maybeSingle();
            if (!exists) {
              await supabase.from('subjects').insert({ school_id: school.id, name: subjectName });
            }
          }
        }
      }
    } catch (e) {
      console.error('Error seeding subjects:', e);
    }
  };
  seedSubjects();

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };

  // Auth Routes
  app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    const { data: user } = await supabase.from('app_users').select('*').eq('username', username).maybeSingle();
    
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, role: user.role, school_id: user.school_id, name: user.name }, JWT_SECRET);
    res.json({ token, user: { id: user.id, role: user.role, school_id: user.school_id, name: user.name } });
  });

  // Super Admin Routes
  app.post('/api/schools', authenticate, async (req: any, res) => {
    if (req.user.role !== 'super_admin' && req.user.role !== 'associate_admin') return res.status(403).json({ error: 'Forbidden' });
    const { name, address, phone, email, motto, headTeacherName, headTeacherUsername, headTeacherPassword } = req.body;
    
    try {
      const { data: school, error } = await supabase.from('schools').insert({ name, address, phone, email, motto }).select().single();
      if (error) throw error;
      
      if (headTeacherName && headTeacherUsername && headTeacherPassword) {
        const hashedPassword = bcrypt.hashSync(headTeacherPassword, 10);
        await supabase.from('app_users').insert({
          name: headTeacherName,
          username: headTeacherUsername,
          password: hashedPassword,
          role: 'school_head',
          school_id: school.id
        });
      }
      res.json({ id: school.id, name });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create school' });
    }
  });

  app.get('/api/schools', authenticate, async (req: any, res) => {
    if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
    const { data: schools } = await supabase.from('schools').select('*');
    res.json(schools || []);
  });

  app.get('/api/schools/:id/details', authenticate, async (req: any, res) => {
    if (req.user.role !== 'super_admin' && req.user.role !== 'associate_admin') return res.status(403).json({ error: 'Forbidden' });
    const schoolId = req.params.id;
    
    const { data: school } = await supabase.from('schools').select('*').eq('id', schoolId).single();
    if (!school) return res.status(404).json({ error: 'School not found' });

    const { data: headTeacher } = await supabase.from('app_users').select('name, username').eq('school_id', schoolId).eq('role', 'school_head').maybeSingle();
    const { count: studentsCount } = await supabase.from('app_users').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).eq('role', 'student');
    const { count: teachersCount } = await supabase.from('app_users').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).eq('role', 'teacher');

    res.json({
      ...school,
      headTeacher: headTeacher || null,
      stats: {
        students: studentsCount || 0,
        teachers: teachersCount || 0
      }
    });
  });

  // Classes Routes
  app.post('/api/classes', authenticate, async (req: any, res) => {
    if (req.user.role !== 'school_head' && req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
    const { name } = req.body;
    const schoolId = req.user.school_id;
    try {
      const { data: cls, error } = await supabase.from('classes').insert({ school_id: schoolId, name }).select().single();
      if (error) throw error;
      res.json(cls);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create class' });
    }
  });

  app.get('/api/classes', authenticate, async (req: any, res) => {
    const schoolId = req.user.school_id;
    const { data: classes } = await supabase.from('classes').select('*').eq('school_id', schoolId);
    res.json(classes || []);
  });

  app.get('/api/classes/:id/students', authenticate, async (req: any, res) => {
    const classId = req.params.id;
    const schoolId = req.user.school_id;
    
    const { data: cls } = await supabase.from('classes').select('*').eq('id', classId).eq('school_id', schoolId).maybeSingle();
    if (!cls) return res.status(404).json({ error: 'Class not found' });

    const { data: enrollments } = await supabase.from('enrollments').select('student_id').eq('class_id', classId);
    if (!enrollments || enrollments.length === 0) return res.json([]);
    
    const studentIds = enrollments.map(e => e.student_id);
    const { data: students } = await supabase.from('app_users')
      .select('id, name, username, admission_number')
      .in('id', studentIds)
      .eq('role', 'student');
      
    res.json(students || []);
  });

  app.post('/api/classes/:id/students', authenticate, async (req: any, res) => {
    if (req.user.role !== 'school_head' && req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
    const classId = req.params.id;
    const schoolId = req.user.school_id;
    const { name, username, password, admission_number } = req.body;
    
    try {
      const hashedPassword = bcrypt.hashSync(password, 10);
      const { data: student, error } = await supabase.from('app_users').insert({
        name, username, password: hashedPassword, role: 'student', school_id: schoolId, admission_number
      }).select().single();
      
      if (error) throw error;
      
      await supabase.from('enrollments').insert({ student_id: student.id, class_id: classId });
      res.json({ success: true });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: 'Failed to add student' });
    }
  });

  app.delete('/api/classes/:classId/students/:studentId', authenticate, async (req: any, res) => {
    if (req.user.role !== 'school_head' && req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
    const { classId, studentId } = req.params;
    
    try {
      await supabase.from('enrollments').delete().eq('student_id', studentId).eq('class_id', classId);
      await supabase.from('app_users').delete().eq('id', studentId).eq('role', 'student');
      res.json({ success: true });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: 'Failed to delete student' });
    }
  });

  // School Head Routes
  app.get('/api/school/stats', authenticate, async (req: any, res) => {
    const schoolId = req.user.school_id;
    const { count: teachers } = await supabase.from('app_users').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).eq('role', 'teacher');
    const { count: students } = await supabase.from('app_users').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).eq('role', 'student');
    const { count: classes } = await supabase.from('classes').select('*', { count: 'exact', head: true }).eq('school_id', schoolId);
    
    res.json({ teachers: teachers || 0, students: students || 0, classes: classes || 0 });
  });

  // Grading System Routes
  app.get('/api/grading', authenticate, async (req: any, res) => {
    const schoolId = req.user.school_id;
    const { data: grading } = await supabase.from('grading_systems').select('*').eq('school_id', schoolId).order('min_score', { ascending: false });
    
    if (!grading || grading.length === 0) {
      const defaultGrading = [
        { min_score: 80, max_score: 100, grade: 'A', points: 12 },
        { min_score: 75, max_score: 79, grade: 'A-', points: 11 },
        { min_score: 70, max_score: 74, grade: 'B+', points: 10 },
        { min_score: 65, max_score: 69, grade: 'B', points: 9 },
        { min_score: 60, max_score: 64, grade: 'B-', points: 8 },
        { min_score: 55, max_score: 59, grade: 'C+', points: 7 },
        { min_score: 50, max_score: 54, grade: 'C', points: 6 },
        { min_score: 45, max_score: 49, grade: 'C-', points: 5 },
        { min_score: 40, max_score: 44, grade: 'D+', points: 4 },
        { min_score: 35, max_score: 39, grade: 'D', points: 3 },
        { min_score: 30, max_score: 34, grade: 'D-', points: 2 },
        { min_score: 0, max_score: 29, grade: 'E', points: 1 },
      ];
      res.json(defaultGrading);
    } else {
      res.json(grading);
    }
  });

  app.post('/api/grading', authenticate, async (req: any, res) => {
    if (req.user.role !== 'school_head' && req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
    const schoolId = req.user.school_id;
    const { grading } = req.body;
    
    try {
      await supabase.from('grading_systems').delete().eq('school_id', schoolId);
      const inserts = grading.map((g: any) => ({ school_id: schoolId, min_score: g.min_score, max_score: g.max_score, grade: g.grade, points: g.points }));
      await supabase.from('grading_systems').insert(inserts);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to update grading system' });
    }
  });

  // Marks Routes
  app.post('/api/marks', authenticate, async (req: any, res) => {
    if (req.user.role !== 'teacher' && req.user.role !== 'school_head' && req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
    const { student_id, subject_id, score, term, year } = req.body;
    
    const { data: existing } = await supabase.from('marks')
      .select('id')
      .eq('student_id', student_id)
      .eq('subject_id', subject_id)
      .eq('term', term)
      .eq('year', year)
      .maybeSingle();
    
    if (existing) {
      await supabase.from('marks').update({ score, teacher_id: req.user.id }).eq('id', existing.id);
    } else {
      await supabase.from('marks').insert({ student_id, subject_id, teacher_id: req.user.id, score, term, year });
    }
    
    broadcast({ type: 'MARKS_UPDATED', school_id: req.user.school_id });
    res.json({ success: true });
  });

  app.put('/api/marks', authenticate, async (req: any, res) => {
    if (req.user.role !== 'teacher' && req.user.role !== 'school_head' && req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
    const { student_id, subject_id, score, term, year } = req.body;
    
    const { data: existing } = await supabase.from('marks')
      .select('id')
      .eq('student_id', student_id)
      .eq('subject_id', subject_id)
      .eq('term', term)
      .eq('year', year)
      .maybeSingle();
    
    if (existing) {
      await supabase.from('marks').update({ score, teacher_id: req.user.id }).eq('id', existing.id);
      broadcast({ type: 'MARKS_UPDATED', school_id: req.user.school_id });
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Mark not found' });
    }
  });

  app.get('/api/marks', authenticate, async (req: any, res) => {
    if (req.user.role !== 'school_head' && req.user.role !== 'super_admin' && req.user.role !== 'teacher') return res.status(403).json({ error: 'Forbidden' });
    const schoolId = req.user.school_id;
    const { class_id, subject_id, term, year } = req.query;

    let query = supabase.from('marks').select('*');
    if (subject_id) query = query.eq('subject_id', subject_id);
    if (term) query = query.eq('term', term);
    if (year) query = query.eq('year', year);

    const { data: marks } = await query;
    if (!marks || marks.length === 0) return res.json([]);

    // Fetch related data manually to avoid complex joins if schema is not perfectly set up
    const studentIds = [...new Set(marks.map(m => m.student_id))];
    const subjectIds = [...new Set(marks.map(m => m.subject_id))];

    let studentsQuery = supabase.from('app_users').select('id, name, admission_number, school_id').in('id', studentIds).eq('school_id', schoolId);
    const { data: students } = await studentsQuery;
    
    if (!students || students.length === 0) return res.json([]);
    const validStudentIds = students.map(s => s.id);
    
    let filteredMarks = marks.filter(m => validStudentIds.includes(m.student_id));

    if (class_id) {
      const { data: enrollments } = await supabase.from('enrollments').select('student_id').eq('class_id', class_id).in('student_id', validStudentIds);
      const enrolledStudentIds = (enrollments || []).map(e => e.student_id);
      filteredMarks = filteredMarks.filter(m => enrolledStudentIds.includes(m.student_id));
    }

    const { data: subjects } = await supabase.from('subjects').select('id, name').in('id', subjectIds);

    const result = filteredMarks.map(m => {
      const student = students.find(s => s.id === m.student_id);
      const subject = (subjects || []).find(s => s.id === m.subject_id);
      return {
        ...m,
        student_name: student?.name,
        admission_number: student?.admission_number,
        subject_name: subject?.name
      };
    });

    res.json(result);
  });

  app.get('/api/marks/process', authenticate, async (req: any, res) => {
    if (req.user.role !== 'school_head' && req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
    const schoolId = req.user.school_id;
    const { class_id, term, year } = req.query;

    if (!class_id || !term || !year) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    const { data: enrollments } = await supabase.from('enrollments').select('student_id').eq('class_id', class_id);
    if (!enrollments || enrollments.length === 0) return res.json({ subjects: [], results: [] });
    
    const studentIds = enrollments.map(e => e.student_id);
    const { data: students } = await supabase.from('app_users').select('id, name, admission_number').in('id', studentIds).eq('school_id', schoolId);
    
    const { data: subjects } = await supabase.from('subjects').select('id, name').eq('school_id', schoolId);
    
    const { data: marks } = await supabase.from('marks')
      .select('student_id, subject_id, score')
      .in('student_id', studentIds)
      .eq('term', term)
      .eq('year', year);

    const results = (students || []).map((student: any) => {
      const studentMarks = (marks || []).filter((m: any) => m.student_id === student.id);
      const marksBySubject: Record<number, number> = {};
      let totalScore = 0;
      
      studentMarks.forEach((m: any) => {
        marksBySubject[m.subject_id] = m.score;
        totalScore += m.score;
      });

      const averageScore = studentMarks.length > 0 ? totalScore / studentMarks.length : 0;
      
      let grade = 'E';
      if (averageScore >= 80) grade = 'A';
      else if (averageScore >= 70) grade = 'B';
      else if (averageScore >= 60) grade = 'C';
      else if (averageScore >= 50) grade = 'D';

      return {
        ...student,
        marks: marksBySubject,
        totalScore,
        averageScore,
        grade
      };
    });

    results.sort((a: any, b: any) => b.totalScore - a.totalScore);

    res.json({
      subjects: subjects || [],
      results
    });
  });

  app.get('/api/marks/analysis', authenticate, async (req: any, res) => {
    const schoolId = req.user.school_id;
    
    const { data: students } = await supabase.from('app_users').select('id, name').eq('school_id', schoolId).eq('role', 'student');
    if (!students || students.length === 0) return res.json([]);
    
    const studentIds = students.map(s => s.id);
    const { data: marks } = await supabase.from('marks').select('student_id, score').in('student_id', studentIds);
    
    const analysis = students.map(student => {
      const studentMarks = (marks || []).filter(m => m.student_id === student.id);
      const average_score = studentMarks.length > 0 
        ? studentMarks.reduce((sum, m) => sum + m.score, 0) / studentMarks.length 
        : 0;
      return { name: student.name, average_score };
    }).sort((a, b) => b.average_score - a.average_score);
    
    res.json(analysis);
  });

  // Materials Routes
  app.post('/api/materials', authenticate, async (req: any, res) => {
    if (req.user.role !== 'teacher') return res.status(403).json({ error: 'Forbidden' });
    const { title, type, content } = req.body;
    await supabase.from('materials').insert({
      school_id: req.user.school_id,
      teacher_id: req.user.id,
      title,
      type,
      content
    });
    res.json({ success: true });
  });

  app.get('/api/materials', authenticate, async (req: any, res) => {
    const schoolId = req.user.school_id;
    const { data: materials } = await supabase.from('materials').select('*').eq('school_id', schoolId).eq('status', 'approved');
    res.json(materials || []);
  });

  // User Management
  app.post('/api/users', authenticate, async (req: any, res) => {
    const { name, username, password, role, school_id, admission_number } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    await supabase.from('app_users').insert({
      name,
      username,
      password: hashedPassword,
      role,
      school_id: school_id || req.user.school_id,
      admission_number
    });
    res.json({ success: true });
  });

  app.get('/api/users/students', authenticate, async (req: any, res) => {
    const schoolId = req.user.school_id;
    const { data: students } = await supabase.from('app_users').select('id, name, admission_number').eq('school_id', schoolId).eq('role', 'student');
    res.json(students || []);
  });

  app.get('/api/users/teachers', authenticate, async (req: any, res) => {
    const schoolId = req.user.school_id;
    const { data: teachers } = await supabase.from('app_users').select('id, name, username').eq('school_id', schoolId).eq('role', 'teacher');
    res.json(teachers || []);
  });

  app.get('/api/subjects', authenticate, async (req: any, res) => {
    const schoolId = req.user.school_id;
    const { data: subjects } = await supabase.from('subjects').select('*').eq('school_id', schoolId);
    res.json(subjects || []);
  });

  app.post('/api/subjects', authenticate, async (req: any, res) => {
    if (req.user.role !== 'school_head' && req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
    const { name } = req.body;
    const schoolId = req.user.school_id;
    try {
      const { data: subject, error } = await supabase.from('subjects').insert({ school_id: schoolId, name }).select().single();
      if (error) throw error;
      res.json(subject);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create subject' });
    }
  });

  app.delete('/api/subjects/:id', authenticate, async (req: any, res) => {
    if (req.user.role !== 'school_head' && req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
    const subjectId = req.params.id;
    const schoolId = req.user.school_id;
    try {
      await supabase.from('subjects').delete().eq('id', subjectId).eq('school_id', schoolId);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete subject' });
    }
  });

  app.get('/api/student/marks', authenticate, async (req: any, res) => {
    if (req.user.role !== 'student') return res.status(403).json({ error: 'Forbidden' });
    const studentId = req.user.id;
    
    const { data: marks } = await supabase.from('marks').select('*').eq('student_id', studentId).order('year', { ascending: false }).order('term', { ascending: false });
    if (!marks || marks.length === 0) return res.json([]);
    
    const subjectIds = [...new Set(marks.map(m => m.subject_id))];
    const { data: subjects } = await supabase.from('subjects').select('id, name').in('id', subjectIds);
    
    const result = marks.map(m => {
      const subject = (subjects || []).find(s => s.id === m.subject_id);
      return {
        ...m,
        subject_name: subject?.name || 'Unknown Subject'
      };
    });
    
    res.json(result);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
