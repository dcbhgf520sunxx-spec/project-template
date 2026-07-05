import './HomePage.css';
import skateboardingRobot from '../../../assets/home/skateboarding-robot.mp4';

export function HomePage() {
  return (
    <section className="home-page" aria-label="首页">
      <div className="home-page__welcome">
        <span className="home-page__mark">安</span>
        <h1>欢迎使用小安智能管理平台</h1>
        <p>让日常管理更清晰、更有序。</p>
      </div>
      <div className="home-page__visual" aria-hidden="true">
        <video className="home-page__video" src={skateboardingRobot} autoPlay muted loop playsInline preload="auto" />
      </div>
    </section>
  );
}
