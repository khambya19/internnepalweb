import React, { createContext, useState, useEffect } from 'react';

// Create the context
export const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null); // Store user info
	const [loading, setLoading] = useState(true);

	// Check for user/token on mount
	useEffect(() => {
		const storedUser = localStorage.getItem('user');
		if (storedUser) setUser(JSON.parse(storedUser));
		setLoading(false);
	}, []);

	// Login function
	const login = (userData, token) => {
		setUser(userData);
		localStorage.setItem('user', JSON.stringify(userData));
		localStorage.setItem('token', token);
	};

	// Logout function
	const logout = () => {
		setUser(null);
		localStorage.removeItem('user');
		localStorage.removeItem('token');
	};

	return (
		<AuthContext.Provider value={{ user, login, logout, loading }}>
			{children}
		</AuthContext.Provider>
	);
};
