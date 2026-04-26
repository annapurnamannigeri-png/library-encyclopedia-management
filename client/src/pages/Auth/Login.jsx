import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { BookOpen, AlertCircle, Loader } from 'lucide-react';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', usn_or_email: '', password: '', role: 'student' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    let result;
    const authPayload = { 
      password: formData.password, 
      role: formData.role 
    };
    if (formData.role === 'student') authPayload.usn = formData.usn_or_email;
    if (formData.role === 'admin') authPayload.email = formData.usn_or_email;

    if (isLogin) {
      result = await login(authPayload);
    } else {
      authPayload.name = formData.name;
      result = await register(authPayload);
    }

    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/20 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-accent/20 blur-[150px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
            <BookOpen size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">ShelfSense</h1>
          <p className="text-textSubtle mt-2">Smart Library Access Management</p>
        </div>

        <div className="glass-panel p-8 rounded-3xl relative z-10">
          <h2 className="text-2xl font-semibold mb-6 flex justify-between items-end">
            <span>{isLogin ? 'Welcome Back' : 'Create Account'}</span>
            <button 
              type="button" 
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              {isLogin ? 'Need an account?' : 'Already have one?'}
            </button>
          </h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center space-x-2 text-sm">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection Toggle */}
            <div className="flex p-1 bg-black/40 rounded-xl mb-6">
              <button
                type="button"
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  formData.role === 'student' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-textSubtle hover:text-white'
                }`}
                onClick={() => setFormData({ ...formData, role: 'student', usn_or_email: '' })}
              >
                Student Portal
              </button>
              <button
                type="button"
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  formData.role === 'admin' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-textSubtle hover:text-white'
                }`}
                onClick={() => setFormData({ ...formData, role: 'admin', usn_or_email: '' })}
              >
                Admin Panel
              </button>
            </div>

            {!isLogin && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <label className="block text-sm font-medium text-textSubtle mb-1">Full Name</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  required={!isLogin}
                  className="input-field"
                  placeholder="John Doe"
                />
              </motion.div>
            )}

            <div>
              <label className="block text-sm font-medium text-textSubtle mb-1">
                 {formData.role === 'student' ? 'USN' : 'Email Address'}
              </label>
              <input 
                type={formData.role === 'student' ? 'text' : 'email'}
                name="usn_or_email" 
                value={formData.usn_or_email} 
                onChange={handleChange} 
                required
                className="input-field placeholder:text-textSubtle/50"
                placeholder={formData.role === 'student' ? 'Ex: 1RV21CS001' : 'admin@library.edu'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-textSubtle mb-1">Password</label>
              <input 
                type="password" 
                name="password" 
                value={formData.password} 
                onChange={handleChange} 
                required
                className="input-field"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary w-full py-3 mt-4 text-lg font-semibold tracking-wide flex justify-center items-center"
            >
              {loading ? <Loader className="animate-spin" size={24} /> : (isLogin ? 'Sign In' : 'Register')}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
