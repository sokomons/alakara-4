import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 48 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 512 512" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background Glow/Circle */}
      <circle cx="256" cy="256" r="240" fill="white" />
      
      {/* Arched Top with Stars */}
      <path d="M100 220C100 140 170 80 256 80C342 80 412 140 412 220" stroke="#F27D26" strokeWidth="12" strokeLinecap="round" />
      <path d="M256 40L265 65H292L270 80L278 105L256 90L234 105L242 80L220 65H247L256 40Z" fill="#FFD700" />
      <path d="M190 60L196 75H212L200 85L205 100L190 90L175 100L180 85L168 75H184L190 60Z" fill="#F27D26" />
      <path d="M322 60L328 75H344L332 85L337 100L322 90L307 100L312 85L300 75H316L322 60Z" fill="#00AEEF" />

      {/* Graduation Cap */}
      <path d="M256 140L340 180L256 220L172 180L256 140Z" fill="#2D3436" />
      <path d="M190 190V230C190 230 220 250 256 250C292 250 322 230 322 230V190" fill="#2D3436" />
      <circle cx="340" cy="180" r="4" fill="#FFD700" />
      <path d="M340 180V240" stroke="#FFD700" strokeWidth="2" />

      {/* Three People */}
      {/* Left (Orange) */}
      <circle cx="170" cy="270" r="25" fill="#F27D26" />
      <path d="M120 380C120 330 140 300 170 300C200 300 220 330 220 380" fill="#F27D26" />
      
      {/* Middle (Green) */}
      <circle cx="256" cy="260" r="30" fill="#006600" />
      <path d="M200 390C200 330 220 300 256 300C292 300 312 330 312 390" fill="#006600" />
      
      {/* Right (Blue) */}
      <circle cx="342" cy="270" r="25" fill="#00AEEF" />
      <path d="M292 380C292 330 312 300 342 300C372 300 392 330 392 380" fill="#00AEEF" />

      {/* Open Book Base */}
      <path d="M100 400C100 400 170 380 256 420C342 380 412 400 412 400V440C412 440 342 420 256 460C170 420 100 440 100 440V400Z" fill="#2D3436" />
      <path d="M256 420V460" stroke="white" strokeWidth="2" />
    </svg>
  );
};

export default Logo;
