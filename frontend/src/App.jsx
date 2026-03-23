import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StallOwnerRegister from "./pages/StallOwnerRegister";
import ForgotPassword from "./pages/ForgotPassword";
import StudentDashboard from "./pages/Students_pages/StudentDashboard";
import StallDashboard from "./pages/Stall_Owner/StallDashboard";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import "./App.css";
import ViewStalls from "./pages/Students_pages/ViewStall";
import BrowseMenu from "./pages/Students_pages/BrowseMenu";
import PlaceOrder from "./pages/Students_pages/PlaceOrder";
import Orders from "./pages/Students_pages/Orders";
import Profile from "./pages/Students_pages/Profile";
import ManageMenuItems from "./pages/Stall_Owner/ManageMenuItems";
import IncomingOrders from "./pages/Stall_Owner/IncomingOrders";
import UpdateOrders from "./pages/Stall_Owner/UpdateOrders";
import SalesSummary from "./pages/Stall_Owner/SalesSummary";
import ManageStudents from "./pages/Admin/ManageStudents";
import ManageStallOwners from "./pages/Admin/ManageStallOwners";
import ManageStalls from "./pages/Admin/ManageStalls";
import ViewReports from "./pages/Admin/ViewReports";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register/stall-owner" element={<StallOwnerRegister />} />
        <Route path="/forgot" element={<ForgotPassword />} />
        
        {/* Admin */}
        <Route path="/admin" element={<AdminDashboard/>} />
        <Route path="/manage-students" element={<ManageStudents />} />
        <Route path="/manage-stall-owners" element={<ManageStallOwners />} />
        <Route path="/manage-stalls" element={<ManageStalls />} />
        <Route path="/view-reports" element={<ViewReports />} />

        {/* Student  */}
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/stalls" element={<ViewStalls/>}/>
        <Route path="/menu" element={<BrowseMenu/>} />
        <Route path="/cart" element={<PlaceOrder/>} />
        <Route path="/orders" element={<Orders/>} />
        <Route path="/profile" element={<Profile/>} />
        {/* Stall Owner */}
        <Route path="/stall" element={<StallDashboard/>} />
        <Route path="/incoming-orders" element={<IncomingOrders />} />
        <Route path="/update-order" element={<UpdateOrders />} />
        <Route path="/sales-summary" element={<SalesSummary />} />
        <Route path="/manage-menu" element={<ManageMenuItems/>} />
      </Routes>
    </BrowserRouter>
  );
}