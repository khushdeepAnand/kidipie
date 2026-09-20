import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

const ProtectedRoute = () => {
    const { user, loading, token } = useAuth();
    console.log("PROTECTED ROUTE:", {
        user,
        loading,
        token,
    });

    if (loading) {
        return <div>Loading...</div>
    }
    if (!token) {
        return <Navigate to="/login" replace />
    }
    return (
        <Outlet />
    )
}

export default ProtectedRoute