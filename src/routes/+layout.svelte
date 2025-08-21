<script>
	import { onMount } from 'svelte';
	import { setContext } from 'svelte';
	import { goto } from '$app/navigation';
	import { fade } from 'svelte/transition';
	import { writable } from 'svelte/store';

	let { children } = $props();

	// Theme store
	const theme = writable('dark');
	setContext('theme', theme);

	let darkModeToggleSrc = $state('/moon.svg');
	let currentTheme = $state('dark');
	let isConnected = $state(false);

	function logout() {
		// Clear all stored data
		localStorage.removeItem('pinecone_api_key');
		localStorage.removeItem('pinecone_cloud');
		localStorage.removeItem('pinecone_region');
		localStorage.removeItem('connection_timestamp');
		localStorage.removeItem('mindnotes-notes');
		localStorage.removeItem('mindnotes-tasks');
		localStorage.removeItem('mindnotes-profile');
		localStorage.removeItem('userStreak');
		localStorage.removeItem('lastActivity');
		
		// Reset connection state
		isConnected = false;
		goto('/');
	}

	function toggleTheme() {
		const body = window.document.body;
		const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
		
		body.classList.remove('dark-mode', 'light-mode');
		body.classList.add(`${newTheme}-mode`);
		
		currentTheme = newTheme;
		darkModeToggleSrc = newTheme === 'dark' ? '/moon.svg' : '/sun.svg';
		
		// Persist theme preference
		localStorage.setItem('theme', newTheme);
		theme.set(newTheme);
	}

	function connectAnimation() {
		isConnected = true;
	}

	function checkConnection() {
		const apiKey = localStorage.getItem('pinecone_api_key');
		const connectionTime = localStorage.getItem('connection_timestamp');
		
		if (apiKey && connectionTime) {
			const isRecentConnection = (Date.now() - parseInt(connectionTime)) < 24 * 60 * 60 * 1000;
			if (isRecentConnection) {
				isConnected = true;
			}
		}
	}

	setContext('animations', { connectAnimation });
	
	onMount(() => {
		const savedTheme = localStorage.getItem('theme') || 'dark';
		currentTheme = savedTheme;
		theme.set(savedTheme);
		
		const body = window.document.body;
		body.classList.add(`${savedTheme}-mode`);
		darkModeToggleSrc = savedTheme === 'dark' ? '/moon.svg' : '/sun.svg';
		
		document.getElementById('dark-mode-toggle')?.addEventListener('click', toggleTheme);
		checkConnection();
	});
</script>

<!-- Enhanced background with improved dark mode colors -->
<div class="background-container">
	<div class="gradient-orb orb-1"></div>
	<div class="gradient-orb orb-2"></div>
	<div class="gradient-orb orb-3"></div>
	<div class="gradient-orb orb-4"></div>
	<div class="animated-mesh"></div>
</div>

<!-- Navigation Bar -->
<nav class="navigation" in:fade={{ duration: 400 }}>
	<div class="nav-content">
		<div class="brand">
			<svg class="brand-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M12 2C13.1 2 14 2.9 14 4C14 4.74 13.6 5.39 13 5.73V7C13 8.1 13.9 9 15 9C16.1 9 17 8.1 17 7V6C17 4.9 17.9 4 19 4C20.1 4 21 4.9 21 6V7C21 8.86 20.11 10.5 18.7 11.35C18.89 11.88 19 12.43 19 13C19 15.76 16.76 18 14 18H10C7.24 18 5 15.76 5 13C5 12.43 5.11 11.88 5.3 11.35C3.89 10.5 3 8.86 3 7V6C3 4.9 3.9 4 5 4C6.1 4 7 4.9 7 6V7C7 8.1 7.9 9 9 9C10.1 9 11 8.1 11 7V5.73C10.4 5.39 10 4.74 10 4C10 2.9 10.9 2 12 2Z" fill="currentColor"/>
			</svg>
			<span class="brand-text">Mind Notes</span>
		</div>
		
		<div class="nav-controls">
			{#if isConnected}
				<button class="nav-btn" onclick={logout} title="Disconnect">
					<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M17 7L15.59 8.41L18.17 11H8V13H18.17L15.59 15.59L17 17L22 12L17 7ZM4 5H12V3H4C2.9 3 2 3.9 2 5V19C2 20.1 2.9 21 4 21H12V19H4V5Z" fill="currentColor"/>
					</svg>
				</button>
			{/if}
			
			<button 
				id="dark-mode-toggle"
				class="theme-toggle"
				title="Toggle theme"
			>
				<img
					src={darkModeToggleSrc || "/moon.svg"}
					alt="Toggle Theme"
				/>
			</button>
		</div>
	</div>
</nav>

<!-- Main Content -->
<main class="main-content" in:fade={{ duration: 400, delay: 100 }}>
	{@render children()}
</main>

<style>
	/* Global styles and improved theme system */
	:global(body) {
		margin: 0;
		padding: 0;
		min-height: 100vh;
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		overflow-x: hidden;
		position: relative;
	}

	:global(body.dark-mode) {
		background: #1a1a2e;
		color: #e2e8f0;
	}

	:global(body.light-mode) {
		background: #f8fafc;
		color: #1e293b;
	}

	/* Enhanced animated background with improved colors */
	.background-container {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: -2;
		overflow: hidden;
	}

	.gradient-orb {
		position: absolute;
		border-radius: 50%;
		filter: blur(60px);
		opacity: 0.4;
		animation: gentleFloat 25s ease-in-out infinite;
	}

	.orb-1 {
		width: 400px;
		height: 400px;
		background: linear-gradient(45deg, #667eea, #764ba2);
		top: -200px;
		left: -200px;
		animation-delay: 0s;
	}

	.orb-2 {
		width: 350px;
		height: 350px;
		background: linear-gradient(45deg, #f093fb, #f5576c);
		top: 30%;
		right: -175px;
		animation-delay: -8s;
	}

	.orb-3 {
		width: 300px;
		height: 300px;
		background: linear-gradient(45deg, #4facfe, #00f2fe);
		bottom: -150px;
		left: 25%;
		animation-delay: -16s;
	}

	.orb-4 {
		width: 250px;
		height: 250px;
		background: linear-gradient(45deg, #43e97b, #38f9d7);
		top: 70%;
		right: 15%;
		animation-delay: -24s;
	}

	.animated-mesh {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: 
			radial-gradient(circle at 25% 75%, rgba(120, 119, 198, 0.2) 0%, transparent 50%),
			radial-gradient(circle at 75% 25%, rgba(255, 119, 198, 0.15) 0%, transparent 50%),
			radial-gradient(circle at 50% 50%, rgba(120, 200, 255, 0.1) 0%, transparent 50%);
		animation: meshShift 40s ease-in-out infinite;
	}

	:global(body.light-mode) .gradient-orb {
		opacity: 0.2;
		filter: blur(80px);
	}

	:global(body.light-mode) .animated-mesh {
		opacity: 0.3;
	}

	@keyframes gentleFloat {
		0%, 100% { 
			transform: translateY(0px) translateX(0px) rotate(0deg); 
		}
		25% { 
			transform: translateY(-20px) translateX(15px) rotate(90deg); 
		}
		50% { 
			transform: translateY(10px) translateX(-10px) rotate(180deg); 
		}
		75% { 
			transform: translateY(-15px) translateX(20px) rotate(270deg); 
		}
	}

	@keyframes meshShift {
		0%, 100% { 
			transform: rotate(0deg) scale(1); 
			filter: hue-rotate(0deg);
		}
		33% { 
			transform: rotate(120deg) scale(1.05); 
			filter: hue-rotate(60deg);
		}
		66% { 
			transform: rotate(240deg) scale(0.95); 
			filter: hue-rotate(120deg);
		}
	}

	/* Navigation */
	.navigation {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 1000;
		padding: 1rem 2rem;
		background: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(20px);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	:global(body.light-mode) .navigation {
		background: rgba(255, 255, 255, 0.8);
		border-bottom-color: rgba(0, 0, 0, 0.1);
	}

	.nav-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		max-width: 1400px;
		margin: 0 auto;
	}

	.brand {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-weight: 700;
		font-size: 1.25rem;
		color: inherit;
		text-decoration: none;
	}

	.brand-icon {
		width: 28px;
		height: 28px;
		color: #667eea;
	}

	.brand-text {
		background: linear-gradient(135deg, #667eea, #764ba2);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.nav-controls {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.nav-btn, .theme-toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border: none;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: inherit;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.nav-btn svg {
		width: 20px;
		height: 20px;
	}

	.theme-toggle img {
		width: 20px;
		height: 20px;
	}

	.nav-btn:hover, .theme-toggle:hover {
		transform: scale(1.1);
		background: rgba(255, 255, 255, 0.2);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
	}

	:global(body.light-mode) .nav-btn,
	:global(body.light-mode) .theme-toggle {
		background: rgba(0, 0, 0, 0.05);
		border-color: rgba(0, 0, 0, 0.1);
	}

	:global(body.light-mode) .nav-btn:hover,
	:global(body.light-mode) .theme-toggle:hover {
		background: rgba(0, 0, 0, 0.1);
	}

	/* Main content area */
	.main-content {
		position: relative;
		z-index: 10;
		min-height: 100vh;
		padding-top: 80px;
	}

	/* Responsive design */
	@media (max-width: 768px) {
		.navigation {
			padding: 1rem;
		}

		.brand-text {
			display: none;
		}

		.nav-btn, .theme-toggle {
			width: 36px;
			height: 36px;
		}

		.nav-btn svg {
			width: 18px;
			height: 18px;
		}

		.theme-toggle img {
			width: 18px;
			height: 18px;
		}

		.main-content {
			padding-top: 70px;
		}

		.gradient-orb {
			width: 200px !important;
			height: 200px !important;
		}
	}

	/* Reduced motion support */
	@media (prefers-reduced-motion: reduce) {
		.gradient-orb,
		.animated-mesh {
			animation: none;
		}
		
		.nav-btn:hover,
		.theme-toggle:hover {
			transform: none;
		}
		
		* {
			transition-duration: 0.1s !important;
		}
	}
</style>
