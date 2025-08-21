<script>
	import { onMount } from 'svelte';
	import { getContext } from 'svelte';
	import { goto } from '$app/navigation';
	import { fade, slide, fly } from 'svelte/transition';
	import { elasticOut } from 'svelte/easing';
	import { writable } from 'svelte/store';

	let { data } = $props();
	
	const apiKey = writable('');
	const cloud = writable('aws');
	const region = writable('us-east-1');
	const landingPage = writable(true);
	const isConnecting = writable(false);
	const showForm = writable(false);
	
	const animations = getContext('animations');
	const theme = getContext('theme');
	
	// Motivational quotes array
	const quotes = [
		"Unlock your mind, one note at a time",
		"Transform thoughts into possibilities",
		"Every note is a step towards greatness",
		"Capture today, inspire tomorrow",
		"Your ideas deserve a beautiful home",
		"Organize your thoughts, organize your life",
		"From scattered thoughts to focused action"
	];
	
	let currentQuote = $state(quotes[0]);
	let quoteIndex = $state(0);
	
	/**
	 * @type {(HTMLDivElement | undefined)[]}
	 */
	let floatingElements = [];

	async function createIndex() {
		const apiKeyValue = $apiKey;
		if (!apiKeyValue.trim()) {
			alert('Please enter your Pinecone API Key');
			return;
		}

		$isConnecting = true;
		
		try {
			const response = await fetch('/create-index', {
				method: 'POST',
				headers: { 
					'Content-Type': 'application/json',
					'Accept': 'application/json'
				},
				body: JSON.stringify({ 
					apiKey: apiKeyValue.trim(), 
					cloud: $cloud, 
					region: $region 
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || `HTTP ${response.status}`);
			}

			const result = await response.json();
			if (result.error) {
				alert(`Connection failed: ${result.error}`);
			} else {
				// Store credentials securely
				localStorage.setItem('pinecone_api_key', apiKeyValue);
				localStorage.setItem('pinecone_cloud', $cloud);
				localStorage.setItem('pinecone_region', $region);
				localStorage.setItem('connection_timestamp', Date.now().toString());
				
				animations.connectAnimation();
				
				setTimeout(() => {
					goto('/notes');
					$landingPage = false;
					// Clean up floating elements
					floatingElements.forEach(element => element?.remove());
				}, 500);
			}
		} catch (error) {
			console.error('Connection error:', error);
			alert(`Connection failed: ${error.message || 'Please check your configuration and try again.'}`);
		} finally {
			$isConnecting = false;
		}
	}

	function rotateQuote() {
		quoteIndex = (quoteIndex + 1) % quotes.length;
		currentQuote = quotes[quoteIndex];
	}

	/**
	 * @param {number} [x]
	 * @param {number} [y]
	 */
	function createFloatingElement(x, y) {
		if ($landingPage) {
			const element = document.createElement('div');
			element.classList.add('floating-circle');

			element.style.width = `${Math.random() * 100 + 50}px`;
			element.style.height = element.style.width;
			element.style.left = `${x || Math.random() * 100}%`;
			element.style.top = `${y || Math.random() * 100}%`;

			document.body.appendChild(element);
			return element;
		}
	}

	onMount(() => {
		// Check for existing connection
		const storedApiKey = localStorage.getItem('pinecone_api_key');
		const connectionTime = localStorage.getItem('connection_timestamp');
		
		// Check if connection is recent (within 24 hours)
		const isRecentConnection = connectionTime && 
			(Date.now() - parseInt(connectionTime)) < 24 * 60 * 60 * 1000;
		
		if (storedApiKey && isRecentConnection) {
			goto('/notes');
			return;
		}
		
		// Clear old connection data
		if (storedApiKey && !isRecentConnection) {
			localStorage.removeItem('pinecone_api_key');
			localStorage.removeItem('pinecone_cloud');
			localStorage.removeItem('pinecone_region');
			localStorage.removeItem('connection_timestamp');
		}
		
		setTimeout(() => {
			$showForm = true;
		}, 300);
		
		// Rotate quotes every 4 seconds
		const quoteInterval = setInterval(rotateQuote, 4000);
		
		document.getElementById('pcKey')?.addEventListener('keypress', async (ev) => {
			if (ev.code == 'Enter') await createIndex();
		});

		// Create floating elements
		setTimeout(() => {
			floatingElements.push(createFloatingElement(10, 20));
		}, 500);
		setTimeout(() => {
			floatingElements.push(createFloatingElement(85, 75));
		}, 1200);
		setTimeout(() => {
			floatingElements.push(createFloatingElement(50, 85));
		}, 2000);
		
		return () => {
			clearInterval(quoteInterval);
		};
	});
</script>

<div class="landing-container">
	<!-- Compact Hero Section -->
	<div class="hero-section" in:fade={{ duration: 800 }}>
		<div class="brand-container" in:fly={{ y: -30, duration: 1000, delay: 200 }}>
			<h1 class="brand-title">{data.title}</h1>
			<div class="quote-container">
				<p class="motivational-quote" key={currentQuote}>
					{currentQuote}
				</p>
			</div>
		</div>
	</div>

	{#if $showForm}
		<div class="connection-container" in:fade={{ duration: 600, delay: 200 }}>
			<div class="connection-form" in:fly={{ y: 30, duration: 800, easing: elasticOut }}>
				<div class="form-header">
					<svg class="brain-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M12 2C13.1 2 14 2.9 14 4C14 4.74 13.6 5.39 13 5.73V7C13 8.1 13.9 9 15 9C16.1 9 17 8.1 17 7V6C17 4.9 17.9 4 19 4C20.1 4 21 4.9 21 6V7C21 8.86 20.11 10.5 18.7 11.35C18.89 11.88 19 12.43 19 13C19 15.76 16.76 18 14 18H10C7.24 18 5 15.76 5 13C5 12.43 5.11 11.88 5.3 11.35C3.89 10.5 3 8.86 3 7V6C3 4.9 3.9 4 5 4C6.1 4 7 4.9 7 6V7C7 8.1 7.9 9 9 9C10.1 9 11 8.1 11 7V5.73C10.4 5.39 10 4.74 10 4C10 2.9 10.9 2 12 2Z" fill="currentColor"/>
					</svg>
					<h2>Connect to Start Your Journey</h2>
				</div>
				
				<div class="form-group" in:fly={{ x: -20, duration: 500, delay: 600 }}>
					<label for="pcKey">
						<svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M6 10V8C6 5.79 7.79 4 10 4H14C16.21 4 18 5.79 18 8V10C19.1 10 20 10.9 20 12V18C20 19.1 19.1 20 18 20H6C4.9 20 4 19.1 4 18V12C4 10.9 4.9 10 6 10ZM8 8V10H16V8C16 6.9 15.1 6 14 6H10C8.9 6 8 6.9 8 8Z" fill="currentColor"/>
						</svg>
						Pinecone API Key
					</label>
					<input
						id="pcKey"
						type="password"
						placeholder="Enter your Pinecone API Key"
						maxlength="200"
						bind:value={$apiKey}
						disabled={$isConnecting}
						class="main-input"
					/>
				</div>
				
				<div class="form-row">
					<div class="form-group" in:fly={{ x: -20, duration: 500, delay: 700 }}>
						<label for="cloud">
							<svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M19.35 10.04C18.67 6.59 15.64 4 12 4C9.11 4 6.6 5.64 5.35 8.04C2.34 8.36 0 10.91 0 14C0 17.31 2.69 20 6 20H19C21.76 20 24 17.76 24 15C24 12.36 21.95 10.22 19.35 10.04Z" fill="currentColor"/>
							</svg>
							Cloud Provider
						</label>
						<select id="cloud" bind:value={$cloud} disabled={$isConnecting}>
							<option value="aws">AWS</option>
							<option value="gcp">Google Cloud</option>
							<option value="azure">Azure</option>
						</select>
					</div>
					
					<div class="form-group" in:fly={{ x: 20, duration: 500, delay: 700 }}>
						<label for="region">
							<svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22S19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9S10.62 6.5 12 6.5S14.5 7.62 14.5 9S13.38 11.5 12 11.5Z" fill="currentColor"/>
							</svg>
							Region
						</label>
						<input
							id="region"
							type="text"
							placeholder="us-east-1"
							maxlength="50"
							bind:value={$region}
							disabled={$isConnecting}
						/>
					</div>
				</div>
				
				<button 
					class="connect-button" 
					class:connecting={$isConnecting}
					onclick={createIndex}
					disabled={$isConnecting}
					in:fly={{ y: 20, duration: 600, delay: 800 }}
				>
					{#if $isConnecting}
						<span class="spinner"></span>
						Connecting...
					{:else}
						<svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M8 5V7C8 8.1 8.9 9 10 9H14C15.1 9 16 8.1 16 7V5C16 3.9 15.1 3 14 3H10C8.9 3 8 3.9 8 5ZM18 9H16V7C16 5.9 15.1 5 14 5H10C8.9 5 8 5.9 8 7V9H6C4.9 9 4 9.9 4 11V19C4 20.1 4.9 21 6 21H18C19.1 21 20 20.1 20 19V11C20 9.9 19.1 9 18 9Z" fill="currentColor"/>
						</svg>
						Connect to Mind Notes
					{/if}
				</button>
				
				<div class="help-text" in:fade={{ duration: 400, delay: 1000 }}>
					<p>
						<svg class="icon small" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22S22 17.52 22 12S17.52 2 12 2ZM13 17H11V11H13V17ZM13 9H11V7H13V9Z" fill="currentColor"/>
						</svg>
						Get your API key from the 
						<a href="https://app.pinecone.io" target="_blank" rel="noopener noreferrer">
							Pinecone Console
						</a>
					</p>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.landing-container {
		width: 100%;
		height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		position: relative;
		overflow: hidden;
	}

	.hero-section {
		text-align: center;
		margin-bottom: 2rem;
		z-index: 2;
	}

	.brand-container {
		max-width: 600px;
		margin: 0 auto;
	}

	.brand-title {
		font-size: clamp(2.5rem, 6vw, 4rem);
		font-weight: 800;
		margin-bottom: 0.75rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		letter-spacing: -0.03em;
		text-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
	}

	.quote-container {
		margin: 1rem 0;
		min-height: 3rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.motivational-quote {
		font-size: clamp(1rem, 2.5vw, 1.4rem);
		font-weight: 400;
		opacity: 0.9;
		font-style: italic;
		margin: 0;
		text-align: center;
		line-height: 1.4;
		animation: fadeInUp 0.6s ease-out;
	}

	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(15px);
		}
		to {
			opacity: 0.9;
			transform: translateY(0);
		}
	}

	/* Compact connection form */
	.connection-container {
		width: 100%;
		max-width: 450px;
		margin: 0 auto;
		z-index: 2;
	}

	.connection-form {
		background: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(25px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 20px;
		padding: 2rem;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
		transition: all 0.3s ease;
	}

	:global(body.light-mode) .connection-form {
		background: rgba(255, 255, 255, 0.9);
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.05);
	}

	.form-header {
		text-align: center;
		margin-bottom: 1.5rem;
	}

	.brain-icon {
		width: 2.5rem;
		height: 2.5rem;
		margin-bottom: 0.75rem;
		color: #667eea;
	}

	.form-header h2 {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0;
		opacity: 0.9;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
		font-weight: 600;
		font-size: 0.875rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		opacity: 0.9;
		color: #1e293b;
	}

	:global(body.dark-mode) label {
		color: #e2e8f0;
	}

	.icon {
		width: 1rem;
		height: 1rem;
		flex-shrink: 0;
	}

	.icon.small {
		width: 0.875rem;
		height: 0.875rem;
	}

	input, select {
		width: 100%;
		padding: 0.875rem 1rem;
		font-size: 1rem;
		border: 2px solid rgba(255, 255, 255, 0.1);
		border-radius: 10px;
		background: rgba(255, 255, 255, 0.05);
		color: inherit;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		font-family: inherit;
	}

	:global(body.light-mode) input,
	:global(body.light-mode) select {
		background: rgba(255, 255, 255, 0.8);
		border: 2px solid rgba(0, 0, 0, 0.1);
		color: #1e293b;
	}

	input:focus, select:focus {
		outline: none;
		border-color: #667eea;
		background: rgba(102, 126, 234, 0.1);
		transform: translateY(-1px);
		box-shadow: 0 8px 20px rgba(102, 126, 234, 0.2);
	}

	input::placeholder {
		color: rgba(255, 255, 255, 0.5);
	}

	:global(body.light-mode) input::placeholder {
		color: rgba(0, 0, 0, 0.5);
	}

	input:disabled, select:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	/* Enhanced connect button */
	.connect-button {
		width: 100%;
		padding: 1rem 2rem;
		font-size: 1rem;
		font-weight: 600;
		border: none;
		border-radius: 10px;
		background: linear-gradient(135deg, #667eea, #764ba2);
		color: white;
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
		overflow: hidden;
		margin-top: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.connect-button:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 12px 30px rgba(102, 126, 234, 0.4);
		background: linear-gradient(135deg, #5a67d8, #6b46c1);
	}

	.connect-button:active:not(:disabled) {
		transform: translateY(-1px);
	}

	.connect-button.connecting {
		background: linear-gradient(135deg, #64748b, #475569);
		cursor: not-allowed;
	}

	.spinner {
		width: 1rem;
		height: 1rem;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top: 2px solid white;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.help-text {
		margin-top: 1.5rem;
		text-align: center;
		font-size: 0.8rem;
		opacity: 0.7;
	}

	.help-text p {
		margin: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.help-text a {
		color: #667eea;
		text-decoration: none;
		font-weight: 500;
		transition: all 0.3s ease;
	}

	.help-text a:hover {
		color: #5a67d8;
		text-decoration: underline;
	}

	/* Enhanced floating circles with better design */
	:global(.floating-circle) {
		position: fixed;
		border-radius: 50%;
		z-index: 1;
		background: linear-gradient(45deg, 
			rgba(102, 126, 234, 0.2), 
			rgba(118, 75, 162, 0.2)
		);
		border: 2px solid rgba(102, 126, 234, 0.3);
		transform: scale(0);
		animation:
			floatIn 1.5s ease-out forwards,
			gentleFloat 15s ease-in-out infinite 1.5s,
			fadeOut 1s ease-out 8s forwards;
	}

	:global(body.light-mode) :global(.floating-circle) {
		background: linear-gradient(45deg, 
			rgba(102, 126, 234, 0.15), 
			rgba(118, 75, 162, 0.15)
		);
		border-color: rgba(102, 126, 234, 0.2);
	}

	@keyframes floatIn {
		to {
			transform: scale(1);
			opacity: 0.8;
		}
	}

	@keyframes gentleFloat {
		0%, 100% {
			transform: scale(1) rotate(0deg);
		}
		25% {
			transform: scale(1.1) rotate(90deg);
		}
		50% {
			transform: scale(0.9) rotate(180deg);
		}
		75% {
			transform: scale(1.05) rotate(270deg);
		}
	}

	@keyframes fadeOut {
		to {
			transform: scale(0);
			opacity: 0;
		}
	}

	/* Responsive design */
	@media (max-width: 768px) {
		.landing-container {
			padding: 0.5rem;
		}

		.connection-form {
			padding: 1.5rem;
		}

		.form-row {
			grid-template-columns: 1fr;
		}

		.brand-title {
			font-size: 2.5rem;
		}

		.help-text p {
			flex-direction: column;
			gap: 0.25rem;
		}
	}

	/* Reduced motion support */
	@media (prefers-reduced-motion: reduce) {
		.connect-button:hover:not(:disabled) {
			transform: none;
		}
		
		:global(.floating-circle) {
			animation: none;
			opacity: 0.3;
		}
		
		.motivational-quote {
			animation: none;
		}
	}
</style>
