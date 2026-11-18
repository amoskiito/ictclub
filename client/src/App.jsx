import { Routes, Route, Outlet, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { RequireAuth } from "./auth/Guards";

import Home from "./pages/Home";
import About from "./pages/About";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import CheckIn from "./pages/CheckIn";
import News from "./pages/News";
import NewsPost from "./pages/NewsPost";
import Leadership from "./pages/Leadership";
import Resources from "./pages/Resources";
import Gallery from "./pages/Gallery";
import Sponsors from "./pages/Sponsors";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import Directory from "./pages/Directory";
import MyEvents from "./pages/MyEvents";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Admin from "./admin/Admin";

import Login from "./components/Login";
import Signup from "./components/Signup";
import Dashboard from "./components/Dashboard";

// Navbar and footer on every page; scroll to the top when the page changes.
function Layout() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return (
    <div className="site">
      <Navbar />
      <main className="site-main"><Outlet /></main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/checkin/:id/:secret" element={<RequireAuth><CheckIn /></RequireAuth>} />
        <Route path="/news" element={<News />} />
        <Route path="/news/:id" element={<NewsPost />} />
        <Route path="/leadership" element={<Leadership />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/sponsors" element={<Sponsors />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/services" element={<Navigate to="/events" replace />} />

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />

        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/my-events" element={<RequireAuth><MyEvents /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
        <Route path="/directory" element={<RequireAuth><Directory /></RequireAuth>} />
        <Route path="/admin" element={<RequireAuth role="officer"><Admin /></RequireAuth>} />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
