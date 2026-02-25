import imgApp from '../assets/images/featured-app-dev.png';
import imgDesign from '../assets/images/featured-design.png';
import imgWeb from '../assets/images/featured-web-service.png';

export const FEATURED_SERVICES = [
  {
    id: 'app',
    title: '앱 개발',
    subtitle: 'iOS · Android · React Native',
    desc: '30일 만에 출시하는 프로덕션 수준 앱',
    stars: 5,
    image: imgApp,
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    to: '/projects?category=개발',
  },
  {
    id: 'design',
    title: '앱 UI 전체 디자인',
    subtitle: '220,000원 · 화면 작업',
    desc: '클린하고 모던한 앱 화면 디자인, 브랜드 컬러·다크모드',
    stars: 5,
    image: imgDesign,
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    to: '/projects?category=디자인',
  },
  {
    id: 'web',
    title: '웹 서비스 구축',
    subtitle: '로그인·결제·관리자',
    desc: '30일 내 로그인·결제까지 완성',
    stars: 5,
    image: imgWeb,
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    to: '/projects?category=개발',
  },
];
