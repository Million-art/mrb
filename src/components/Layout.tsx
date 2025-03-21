import { Outlet } from "react-router-dom"; 
import BottomNav from "./BottomNav"; 

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col scrollbar-hidden">
      {/* Main content area */}
      <div className="flex-grow">
        <Outlet /> 
      </div>
      {/* Bottom navigation persists */}
      <BottomNav />
    </div>
  );
};

export default Layout;
