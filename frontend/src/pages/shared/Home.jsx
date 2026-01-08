import React from 'react'

function Home() {
	return (
		<section className="mx-auto max-w-7xl px-6 py-12">
			<div className="text-center">
				<h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Welcome to InternNepal</h1>
				<p className="mt-4 text-gray-600">
					Browse internships, manage applications, and connect with companies.
				</p>
			</div>

			<div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
				<div className="rounded-lg border bg-white p-6 shadow-sm">
					<h2 className="text-xl font-semibold text-gray-800">For Students</h2>
					<p className="mt-2 text-gray-600">Discover opportunities and track your applications.</p>
				</div>
				<div className="rounded-lg border bg-white p-6 shadow-sm">
					<h2 className="text-xl font-semibold text-gray-800">For Companies</h2>
					<p className="mt-2 text-gray-600">Post jobs and manage applicants easily.</p>
				</div>
			</div>
		</section>
	)
}

export default Home

