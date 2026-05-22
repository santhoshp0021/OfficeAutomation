import logo from '../assets/logo.png';

export default function Banner() {
  return (
    <div className="fixed top-0 left-0 w-full z-[1100] bg-beige-50 shadow-sm flex items-center px-6 py-3 gap-6 border-b border-beige-100">
      <img src={logo} alt="Anna University Logo" className="h-14 w-auto flex-shrink-0" />
      <div>
        <h1 className="m-0 text-2xl font-bold text-primary tracking-wide leading-tight">Anna University</h1>
        <p className="m-0 text-sm text-primary-light">Sardar Patel Road, Chennai - 600 025, Tamil Nadu</p>
      </div>
    </div>
  );
}
