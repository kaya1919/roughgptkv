<!-- <script>
	import { onMount } from 'svelte';
	import { setContext } from 'svelte';
	import { goto } from '$app/navigation';

	let { children } = $props();

	let darkModeToggleSrc = $state('/sun.svg'); // Default icon
	/**
	 * @type {HTMLImageElement}
	 */
	let plug;
	/**
	 * @type {HTMLImageElement}
	 */
	let socket;

	function logout() {
		goto('/');
		plug.classList.remove('connected');
		socket.classList.remove('connected');
		localStorage.removeItem('apiKey');
	}

	function toggle() {
		const body = window.document.body;
		body.classList.toggle('dark-mode');

		// Change icon when toggled
		darkModeToggleSrc = body.classList.contains('dark-mode') ? '/moon.svg' : '/sun.svg';
	}

	function connectAnimation() {
		// Ensure plug exists before modifying it
		if (plug) {
			plug.classList.add('connected');
			socket.classList.add('connected');
		}
	}

	setContext('animations', { connectAnimation });
	onMount(() => {
		toggle();
		toggle();
		document.getElementById('dark-mode-toggle')?.addEventListener('click', toggle);
		plug.addEventListener('click', logout);
		socket.addEventListener('click', logout);
		if (localStorage.getItem('apiKey')) {
			connectAnimation();
		}
	});
</script>

<img
	id="dark-mode-toggle"
	class="dark-mode-toggle"
	src={darkModeToggleSrc}
	alt="Toggle Dark Mode"
/>

<img bind:this={plug} class="plug" src="/plug.svg" alt="plug" />
<img bind:this={socket} class="socket" src="/socket.svg" alt="socket" />

{@render children()}

<style>
	:global(body) .plug {
		width: 52vw;
		height: auto;
		position: fixed;
		left: -8%;
		bottom: 2.95vw;
		filter: none;
		cursor:pointer;
		transition:
			filter 0.3s,
			left 0.33s;
	}

	:global(body.dark-mode) .plug {
		filter: invert(1);
		transition:
			filter 0.3s,
			left 0.33s;
	}

	:global(body) :global(.plug.connected) {
		left: 0%;
		transition: left 0.33s;
	}

	:global(body) {
		background-color: #d3b251;
		transition: background-color 0.3s;
	}

	:global(body.dark-mode) {
		background-color: black;
		transition: background-color 0.3s;
	}

	:global(body) .socket {
		width: 50vw;
		height: auto;
		bottom: 2.15vw;
		position: fixed;
		right: -10%;
		filter: none;
		cursor:pointer;
		transition:
			filter 0.3s,
			right 0.33s;
	}

	:global(body.dark-mode) .socket {
		filter: invert(1);
		transition:
			filter 0.3s,
			right 0.33s;
	}

	:global(body) :global(.socket.connected) {
		right: 0%;
		transition: right 0.33s;
	}

	.dark-mode-toggle {
		position: fixed;
		right: 4%;
		top: 4.5%;
		cursor: pointer;
		width: 4vw;
		height: auto;
	}
	/*  Highlight effect on hover */
	.dark-mode-toggle:hover {
		filter: brightness(1.2); /* Slight highlight effect */
		transform: scale(1.1); /* Slight zoom effect */
		transition: 0.2s ease-in-out; /* Smooth animation */
	}

	/*  Make the moon icon white when dark mode is active */
	:global(body.dark-mode) .dark-mode-toggle {
		filter: invert(1) brightness(2);
	}

	/* Responsive design for smaller screens */
	@media (max-width: 768px) {
		:global(body) :global(.plug.connected) {
			left: -0.1%;
			transition: left 0.33s;
		}

		:global(body) :global(.socket.connected) {
			right: -0.1%;
			transition: right 0.33s;
		}
	}
</style> -->
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
	
	/**
	 * @type {HTMLImageElement}
	 */
	let plug;
	/**
	 * @type {HTMLImageElement}
	 */
	let socket;

	function logout() {
		goto('/');
		plug.classList.remove('connected');
		socket.classList.remove('connected');
		localStorage.removeItem('apiKey');
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
		if (plug) {
			plug.classList.add('connected');
			socket.classList.add('connected');
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
		plug.addEventListener('click', logout);
		socket.addEventListener('click', logout);
		
		if (localStorage.getItem('apiKey')) {
			connectAnimation();
		}
	});
</script>

<!-- Added parallax background elements -->
<div class="parallax-container">
	<div class="parallax-layer layer-1"></div>
	<div class="parallax-layer layer-2"></div>
	<div class="parallax-layer layer-3"></div>
</div>

<div class="theme-toggle-container" in:fade={{ duration: 300 }}>
	<img
		id="dark-mode-toggle"
		class="dark-mode-toggle"
		src={darkModeToggleSrc || "/placeholder.svg"}
		alt="Toggle Theme"
	/>
</div>

<div class="connection-elements">
	<img bind:this={plug} class="plug" src="/plug.svg" alt="plug" />
	<img bind:this={socket} class="socket" src="/socket.svg" alt="socket" />
</div>

<main class="main-content" in:fade={{ duration: 400, delay: 100 }}>
	{@render children()}
</main>

<style>
	/* Enhanced theme system with smooth transitions */
	:global(body) {
		margin: 0;
		padding: 0;
		min-height: 100vh;
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		overflow-x: hidden;
	}

	:global(body.dark-mode) {
		background: linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 50%, #16213e 100%);
		color: #e2e8f0;
	}

	:global(body.light-mode) {
		background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%);
		color: #1e293b;
	}

	/* Parallax background system */
	.parallax-container {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: -1;
		overflow: hidden;
	}

	.parallax-layer {
		position: absolute;
		width: 120%;
		height: 120%;
		opacity: 0.1;
	}

	.layer-1 {
		background: radial-gradient(circle at 20% 80%, #6366f1 0%, transparent 50%),
					radial-gradient(circle at 80% 20%, #8b5cf6 0%, transparent 50%);
		animation: float 20s ease-in-out infinite;
	}

	.layer-2 {
		background: radial-gradient(circle at 60% 60%, #06b6d4 0%, transparent 40%);
		animation: float 25s ease-in-out infinite reverse;
	}

	.layer-3 {
		background: radial-gradient(circle at 40% 40%, #10b981 0%, transparent 30%);
		animation: float 30s ease-in-out infinite;
	}

	@keyframes float {
		0%, 100% { transform: translateY(0px) rotate(0deg); }
		33% { transform: translateY(-20px) rotate(1deg); }
		66% { transform: translateY(10px) rotate(-1deg); }
	}

	/* Enhanced theme toggle with smooth animations */
	.theme-toggle-container {
		position: fixed;
		right: 2rem;
		top: 2rem;
		z-index: 1000;
	}

	.dark-mode-toggle {
		width: 2.5rem;
		height: 2.5rem;
		cursor: pointer;
		border-radius: 50%;
		padding: 0.5rem;
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.2);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.dark-mode-toggle:hover {
		transform: scale(1.1) rotate(15deg);
		background: rgba(255, 255, 255, 0.2);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
	}

	:global(body.light-mode) .dark-mode-toggle {
		background: rgba(0, 0, 0, 0.05);
		border: 1px solid rgba(0, 0, 0, 0.1);
	}

	:global(body.light-mode) .dark-mode-toggle:hover {
		background: rgba(0, 0, 0, 0.1);
	}

	/* Enhanced connection elements with better positioning */
	.connection-elements {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 100;
		pointer-events: none;
	}

	.plug, .socket {
		pointer-events: all;
		transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.plug {
		width: 52vw;
		height: auto;
		position: absolute;
		left: -8%;
		bottom: 2.95vw;
		filter: none;
		cursor: pointer;
	}

	:global(body.dark-mode) .plug {
		filter: invert(1) brightness(0.9);
	}

	:global(body.light-mode) .plug {
		filter: brightness(0.8);
	}

	:global(.plug.connected) {
		left: 0%;
		transform: scale(1.02);
	}

	.socket {
		width: 50vw;
		height: auto;
		bottom: 2.15vw;
		position: absolute;
		right: -10%;
		filter: none;
		cursor: pointer;
	}

	:global(body.dark-mode) .socket {
		filter: invert(1) brightness(0.9);
	}

	:global(body.light-mode) .socket {
		filter: brightness(0.8);
	}

	:global(.socket.connected) {
		right: 0%;
		transform: scale(1.02);
	}

	/* Main content area with proper spacing */
	.main-content {
		position: relative;
		z-index: 10;
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
	}

	/* Responsive design */
	@media (max-width: 768px) {
		.theme-toggle-container {
			right: 1rem;
			top: 1rem;
		}

		.dark-mode-toggle {
			width: 2rem;
			height: 2rem;
		}

		:global(.plug.connected) {
			left: -0.1%;
		}

		:global(.socket.connected) {
			right: -0.1%;
		}
	}

	/* Reduced motion support */
	@media (prefers-reduced-motion: reduce) {
		.parallax-layer {
			animation: none;
		}
		
		.dark-mode-toggle:hover {
			transform: scale(1.05);
		}
		
		* {
			transition-duration: 0.1s !important;
		}
	}
</style>
