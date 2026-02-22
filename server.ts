import express from 'express';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from './src/db.ts';
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
  const seedSuperAdmin = () => {
    const admin = db.prepare('SELECT * FROM users WHERE role = ?').get('super_admin');
    if (!admin) {
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      db.prepare('INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)')
        .run('Super Admin', 'admin', hashedPassword, 'super_admin');
      console.log('Super Admin seeded: admin / admin123');
    }
  };
  seedSuperAdmin();

  const seedSubjects = () => {
    const schools = db.prepare('SELECT id FROM schools').all() as any[];
    const defaultSubjects = ['Mathematics', 'English', 'Kiswahili', 'Science', 'Social Studies'];
    
    schools.forEach(school => {
      defaultSubjects.forEach(subjectName => {
        const exists = db.prepare('SELECT id FROM subjects WHERE school_id = ? AND name = ?').get(school.id, subjectName);
        if (!exists) {
          db.prepare('INSERT INTO subjects (school_id, name) VALUES (?, ?)').run(school.id, subjectName);
        }
      });
    });
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
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const user: any = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, role: user.role, school_id: user.school_id, name: user.name }, JWT_SECRET);
    res.json({ token, user: { id: user.id, role: user.role, school_id: user.school_id, name: user.name } });
  });

  // Super Admin Routes
  app.post('/api/schools', authenticate, (req: any, res) => {
    if (req.user.role !== 'super_admin' && req.user.role !== 'associate_admin') return res.status(403).json({ error: 'Forbidden' });
    const { name, address, phone, email, motto, headTeacherName, headTeacherUsername, headTeacherPassword } = req.body;
    
    try {
      let schoolId: number | bigint;
      db.transaction(() => {
        const result = db.prepare('INSERT INTO schools (name, address, phone, email, motto) VALUES (?, ?, ?, ?, ?)').run(name, address || null, phone || null, email || null, motto || null);
        schoolId = result.lastInsertRowid;
        
        if (headTeacherName && headTeacherUsername && headTeacherPassword) {
          const hashedPassword = bcrypt.hashSync(headTeacherPassword, 10);
          db.prepare('INSERT INTO users (name, username, password, role, school_id) VALUES (?, ?, ?, ?, ?)')
            .run(headTeacherName, headTeacherUsername, hashedPassword, 'school_head', schoolId);
        }
      })();
      res.json({ id: schoolId!, name });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create school' });
    }
  });

  app.get('/api/schools', authenticate, (req: any, res) => {
    if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
    const schools = db.prepare('SELECT * FROM schools').all();
    res.json(schools);
  });

  app.get('/api/schools/:id/details', authenticate, (req: any, res) => {
    if (req.user.role !== 'super_admin' && req.user.role !== 'associate_admin') return res.status(403).json({ error: 'Forbidden' });
    const schoolId = req.params.id;
    const school = db.prepare('SELECT * FROM schools WHERE id = ?').get(schoolId);
    if (!school) return res.status(404).json({ error: 'School not found' });

    const headTeacher = db.prepare('SELECT name, username FROM users WHERE school_id = ? AND role = ?').get(schoolId, 'school_head');
    const studentsCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE school_id = ? AND role = ?').get(schoolId, 'student') as any;
    const teachersCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE school_id = ? AND role = ?').get(schoolId, 'teacher') as any;

    res.json({
      ...school,
      headTeacher: headTeacher || null,
      stats: {
        students: studentsCount.count,
        teachers: teachersCount.count
      }
    });
  });

  // Classes Routes
  app.post('/api/classes', authenticate, (req: any, res) => {
    if (req.user.role !== 'school_head' && req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
    const { name } = req.body;
    const schoolId = req.user.school_id;
    try {
      const result = db.prepare('INSERT INTO classes (school_id, name) VALUES (?, ?)').run(schoolId, name);
      res.json({ id: result.lastInsertRowid, name, school_id: schoolId });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create class' });
    }
  });

  app.get('/api/classes', authenticate, (req: any, res) => {
    const schoolId = req.user.school_id;
    const classes = db.prepare('SELECT * FROM classes WHERE school_id = ?').all(schoolId);
    res.json(classes);
  });

  app.get('/api/classes/:id/students', authenticate, (req: any, res) => {
    const classId = req.params.id;
    const schoolId = req.user.school_id;
    // Verify class belongs to school
    const cls = db.prepare('SELECT * FROM classes WHERE id = ? AND school_id = ?').get(classId, schoolId);
    if (!cls) return res.status(404).json({ error: 'Class not found' });

    const students = db.prepare(`
      SELECT u.id, u.name, u.username, u.admission_number
      FROM users u
      JOIN enrollments e ON u.id = e.student_id
      WHERE e.class_id = ? AND u.role = 'student'
    `).all(classId);
    res.json(students);
  });

  app.post('/api/classes/:id/students', authenticate, (req: any, res) => {
    if (req.user.role !== 'school_head' && req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
    const classId = req.params.id;
    const schoolId = req.user.school_id;
    const { name, username, password, admission_number } = req.body;
    
    try {
      db.transaction(() => {
        const hashedPassword = bcrypt.hashSync(password, 10);
        const result = db.prepare('INSERT INTO users (name, username, password, role, school_id, admission_number) VALUES (?, ?, ?, ?, ?, ?)')
          .run(name, username, hashedPassword, 'student', schoolId, admission_number);
        
        const studentId = result.lastInsertRowid;
        db.prepare('INSERT INTO enrollments (student_id, class_id) VALUES (?, ?)').run(studentId, classId);
      })();
      res.json({ success: true });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: 'Failed to add student' });
    }
  });

  app.delete('/api/classes/:classId/students/:studentId', authenticate, (req: any, res) => {
    if (req.user.role !== 'school_head' && req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
    const { classId, studentId } = req.params;
    
    try {
      db.transaction(() => {
        db.prepare('DELETE FROM enrollments WHERE student_id = ? AND class_id = ?').run(studentId, classId);
        db.prepare('DELETE FROM users WHERE id = ? AND role = ?').run(studentId, 'student');
      })();
      res.json({ success: true });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: 'Failed to delete student' });
    }
  });

  // School Head Routes
  app.get('/api/school/stats', authenticate, (req: any, res) => {
    const schoolId = req.user.school_id;
    const teachers = db.prepare('SELECT COUNT(*) as count FROM users WHERE school_id = ? AND role = ?').get(schoolId, 'teacher') as any;
    const students = db.prepare('SELECT COUNT(*) as count FROM users WHERE school_id = ? AND role = ?').get(schoolId, 'student') as any;
    const classes = db.prepare('SELECT COUNT(*) as count FROM classes WHERE school_id = ?').get(schoolId) as any;
    res.json({ teachers: teachers.count, students: students.count, classes: classes.count });
  });

  // Grading System Routes
  app.get('/api/grading', authenticate, (req: any, res) => {
    const schoolId = req.user.school_id;
    const grading = db.prepare('SELECT * FROM grading_systems WHERE school_id = ? ORDER BY min_score DESC').all(schoolId);
    
    if (grading.length === 0) {
      // Return default grading system
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

  app.post('/api/grading', authenticate, (req: any, res) => {
    if (req.user.role !== 'school_head' && req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
    const schoolId = req.user.school_id;
    const { grading } = req.body; // Array of grading objects
    
    try {
      db.transaction(() => {
        db.prepare('DELETE FROM grading_systems WHERE school_id = ?').run(schoolId);
        const insert = db.prepare('INSERT INTO grading_systems (school_id, min_score, max_score, grade, points) VALUES (?, ?, ?, ?, ?)');
        for (const g of grading) {
          insert.run(schoolId, g.min_score, g.max_score, g.grade, g.points);
        }
      })();
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to update grading system' });
    }
  });

  // Marks Routes
  app.post('/api/marks', authenticate, (req: any, res) => {
    if (req.user.role !== 'teacher' && req.user.role !== 'school_head' && req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
    const { student_id, subject_id, score, term, year } = req.body;
    
    // Check if mark already exists to update instead of insert
    const existing = db.prepare('SELECT id FROM marks WHERE student_id = ? AND subject_id = ? AND term = ? AND year = ?').get(student_id, subject_id, term, year);
    
    if (existing) {
      db.prepare('UPDATE marks SET score = ?, teacher_id = ? WHERE id = ?')
        .run(score, req.user.id, (existing as any).id);
    } else {
      db.prepare('INSERT INTO marks (student_id, subject_id, teacher_id, score, term, year) VALUES (?, ?, ?, ?, ?, ?)')
        .run(student_id, subject_id, req.user.id, score, term, year);
    }
    
    broadcast({ type: 'MARKS_UPDATED', school_id: req.user.school_id });
    res.json({ success: true });
  });

  app.put('/api/marks', authenticate, (req: any, res) => {
    if (req.user.role !== 'teacher' && req.user.role !== 'school_head' && req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
    const { student_id, subject_id, score, term, year } = req.body;
    
    const existing = db.prepare('SELECT id FROM marks WHERE student_id = ? AND subject_id = ? AND term = ? AND year = ?').get(student_id, subject_id, term, year);
    
    if (existing) {
      db.prepare('UPDATE marks SET score = ?, teacher_id = ? WHERE id = ?')
        .run(score, req.user.id, (existing as any).id);
      broadcast({ type: 'MARKS_UPDATED', school_id: req.user.school_id });
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Mark not found' });
    }
  });

  app.get('/api/marks', authenticate, (req: any, res) => {
    if (req.user.role !== 'school_head' && req.user.role !== 'super_admin' && req.user.role !== 'teacher') return res.status(403).json({ error: 'Forbidden' });
    const schoolId = req.user.school_id;
    const { class_id, subject_id, term, year } = req.query;

    let query = `
      SELECT m.*, u.name as student_name, u.admission_number, s.name as subject_name
      FROM marks m
      JOIN users u ON m.student_id = u.id
      JOIN subjects s ON m.subject_id = s.id
      WHERE u.school_id = ?
    `;
    const params: any[] = [schoolId];

    if (class_id) {
      query += ` AND u.id IN (SELECT student_id FROM enrollments WHERE class_id = ?)`;
      params.push(class_id);
    }
    if (subject_id) {
      query += ` AND m.subject_id = ?`;
      params.push(subject_id);
    }
    if (term) {
      query += ` AND m.term = ?`;
      params.push(term);
    }
    if (year) {
      query += ` AND m.year = ?`;
      params.push(year);
    }

    const marks = db.prepare(query).all(...params);
    res.json(marks);
  });

  app.get('/api/marks/process', authenticate, (req: any, res) => {
    if (req.user.role !== 'school_head' && req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
    const schoolId = req.user.school_id;
    const { class_id, term, year } = req.query;

    if (!class_id || !term || !year) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    // Get all students in the class
    const students = db.prepare(`
      SELECT u.id, u.name, u.admission_number
      FROM users u
      JOIN enrollments e ON u.id = e.student_id
      WHERE e.class_id = ? AND u.school_id = ?
    `).all(class_id, schoolId);

    // Get all subjects for the school
    const subjects = db.prepare('SELECT id, name FROM subjects WHERE school_id = ?').all(schoolId);

    // Get all marks for these students for the given term and year
    const marks = db.prepare(`
      SELECT m.student_id, m.subject_id, m.score
      FROM marks m
      JOIN users u ON m.student_id = u.id
      WHERE u.school_id = ? AND m.term = ? AND m.year = ?
    `).all(schoolId, term, year);

    // Process data
    const results = students.map((student: any) => {
      const studentMarks = marks.filter((m: any) => m.student_id === student.id);
      const marksBySubject: Record<number, number> = {};
      let totalScore = 0;
      
      studentMarks.forEach((m: any) => {
        marksBySubject[m.subject_id] = m.score;
        totalScore += m.score;
      });

      const averageScore = studentMarks.length > 0 ? totalScore / studentMarks.length : 0;
      
      // Simple grading logic
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

    // Sort by total score descending
    results.sort((a: any, b: any) => b.totalScore - a.totalScore);

    res.json({
      subjects,
      results
    });
  });

  app.get('/api/marks/analysis', authenticate, (req: any, res) => {
    const schoolId = req.user.school_id;
    // Simple analysis: average score per student
    const analysis = db.prepare(`
      SELECT u.name, AVG(m.score) as average_score
      FROM marks m
      JOIN users u ON m.student_id = u.id
      WHERE u.school_id = ?
      GROUP BY u.id
      ORDER BY average_score DESC
    `).all(schoolId);
    res.json(analysis);
  });

  // Materials Routes
  app.post('/api/materials', authenticate, (req: any, res) => {
    if (req.user.role !== 'teacher') return res.status(403).json({ error: 'Forbidden' });
    const { title, type, content } = req.body;
    db.prepare('INSERT INTO materials (school_id, teacher_id, title, type, content) VALUES (?, ?, ?, ?, ?)')
      .run(req.user.school_id, req.user.id, title, type, content);
    res.json({ success: true });
  });

  app.get('/api/materials', authenticate, (req: any, res) => {
    const schoolId = req.user.school_id;
    const materials = db.prepare('SELECT * FROM materials WHERE school_id = ? AND status = ?').all(schoolId, 'approved');
    res.json(materials);
  });

  // User Management
  app.post('/api/users', authenticate, (req: any, res) => {
    const { name, username, password, role, school_id, admission_number } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    db.prepare('INSERT INTO users (name, username, password, role, school_id, admission_number) VALUES (?, ?, ?, ?, ?, ?)')
      .run(name, username, hashedPassword, role, school_id || req.user.school_id, admission_number);
    res.json({ success: true });
  });

  app.get('/api/users/students', authenticate, (req: any, res) => {
    const schoolId = req.user.school_id;
    const students = db.prepare('SELECT id, name, admission_number FROM users WHERE school_id = ? AND role = ?').all(schoolId, 'student');
    res.json(students);
  });

  app.get('/api/users/teachers', authenticate, (req: any, res) => {
    const schoolId = req.user.school_id;
    const teachers = db.prepare('SELECT id, name, username FROM users WHERE school_id = ? AND role = ?').all(schoolId, 'teacher');
    res.json(teachers);
  });

  app.get('/api/subjects', authenticate, (req: any, res) => {
    const schoolId = req.user.school_id;
    const subjects = db.prepare('SELECT * FROM subjects WHERE school_id = ?').all(schoolId);
    res.json(subjects);
  });

  app.post('/api/subjects', authenticate, (req: any, res) => {
    if (req.user.role !== 'school_head' && req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
    const { name } = req.body;
    const schoolId = req.user.school_id;
    try {
      const result = db.prepare('INSERT INTO subjects (school_id, name) VALUES (?, ?)').run(schoolId, name);
      res.json({ id: result.lastInsertRowid, name, school_id: schoolId });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create subject' });
    }
  });

  app.delete('/api/subjects/:id', authenticate, (req: any, res) => {
    if (req.user.role !== 'school_head' && req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
    const subjectId = req.params.id;
    const schoolId = req.user.school_id;
    try {
      // Optional: Check if marks exist for this subject before deleting, or cascade delete
      db.prepare('DELETE FROM subjects WHERE id = ? AND school_id = ?').run(subjectId, schoolId);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete subject' });
    }
  });

  app.get('/api/student/marks', authenticate, (req: any, res) => {
    if (req.user.role !== 'student') return res.status(403).json({ error: 'Forbidden' });
    const studentId = req.user.id;
    const marks = db.prepare(`
      SELECT m.*, COALESCE(s.name, 'Unknown Subject') as subject_name
      FROM marks m
      LEFT JOIN subjects s ON m.subject_id = s.id
      WHERE m.student_id = ?
      ORDER BY m.year DESC, m.term DESC
    `).all(studentId);
    res.json(marks);
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
