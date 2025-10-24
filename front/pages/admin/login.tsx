import { useState, FormEvent } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { useAdminAuth } from "../../context/AdminAuthContext";
import Button from "../../components/Admin/Button";

const AdminLogin = () => {
  const router = useRouter();
  const { login } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!login) {
      setError("Login function not available");
      setLoading(false);
      return;
    }

    try {
      const result = await login(email, password);
      if (result.success) {
        router.push("/admin");
      } else {
        setError("Invalid email or password");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-32 h-auto mx-auto mb-4">
            <Image
              src="/logo.svg"
              alt="Logo"
              width={220}
              height={50}
              layout="responsive"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray500">Admin Panel</h1>
          <p className="text-gray400 mt-2">Sign in to manage your store</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 p-3 bg-red bg-opacity-10 border border-red rounded-md">
                <p className="text-red text-sm">{error}</p>
              </div>
            )}

            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray500 mb-2"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
                placeholder="admin@example.com"
              />
            </div>

            <div className="mb-6">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray500 mb-2"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <a
              href="/"
              className="text-sm text-blue hover:underline"
            >
              ← Back to Store
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
