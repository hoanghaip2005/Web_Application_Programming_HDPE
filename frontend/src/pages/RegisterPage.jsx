import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function validateRegistrationForm(form) {
  const username = form.username.trim();
  const email = form.email.trim();

  if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) {
    return "Tên đăng nhập phải dài 3-24 ký tự và chỉ gồm chữ, số hoặc dấu gạch dưới.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Email không hợp lệ.";
  }

  if (!/^(?=.*[A-Za-z])(?=.*\d).{8,64}$/.test(form.password)) {
    return "Mật khẩu phải có ít nhất 8 ký tự, gồm tối thiểu 1 chữ và 1 số.";
  }

  if (form.password !== form.confirmPassword) {
    return "Mật khẩu xác nhận không khớp";
  }

  return "";
}

function RegisterPage() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    const validationError = validateRegistrationForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    const result = await register(form);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    navigate("/app/games", { replace: true });
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <p className="eyebrow">Xác thực</p>
        <h1>Tạo tài khoản</h1>

        <label>
          Tên đăng nhập
          <input
            type="text"
            value={form.username}
            minLength={3}
            maxLength={24}
            pattern="[A-Za-z0-9_]+"
            onChange={(event) =>
              setForm((current) => ({ ...current, username: event.target.value }))
            }
            required
          />
        </label>

        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            required
          />
        </label>

        <label>
          Mật khẩu
          <input
            type="password"
            value={form.password}
            minLength={8}
            onChange={(event) =>
              setForm((current) => ({ ...current, password: event.target.value }))
            }
            required
          />
          <small className="muted">Ít nhất 8 ký tự, gồm chữ và số.</small>
        </label>

        <label>
          Xác nhận mật khẩu
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                confirmPassword: event.target.value
              }))
            }
            required
          />
        </label>

        {error ? <p className="error-text">{error}</p> : null}

        <button type="submit" className="primary-button" disabled={loading}>
          {loading ? "Đang xử lý..." : "Đăng ký"}
        </button>

        <p className="muted">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </form>
    </div>
  );
}

export default RegisterPage;
