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
	
	/**
	 * @type {(HTMLSpanElement | undefined)[]}
	 */
	let ripples = [];

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
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ apiKey: apiKeyValue, cloud: $cloud, region: $region })
			});

			const result = await response.json();
			if (result.error) {
				alert(result.error);
			} else {
				localStorage.setItem('apiKey', apiKeyValue);
				animations.connectAnimation();
				
				setTimeout(() => {
					goto('/new');
					$landingPage = false;
					for (let index = 0; index < ripples.length; index++) {
						ripples[index]?.remove();
					}
				}, 500);
			}
		} catch (error) {
			alert('Connection failed. Please try again.');
		} finally {
			$isConnecting = false;
		}
	}

	/**
	 * @param {number} [x]
	 * @param {number} [y]
	 */
	function createRipple(x, y) {
		if ($landingPage) {
			const ripple = document.createElement('span');
			ripple.classList.add('ripple');

			ripple.style.width = `${x == 0 ? 855 : 186}px`;
			ripple.style.height = `${x == 0 ? 855 : 186}px`;

			ripple.style.left = `${x}%`;
			ripple.style.top = `${y}%`;

			document.body.appendChild(ripple);
			return ripple;
		}
	}

	onMount(() => {
		if (localStorage.getItem('apiKey')) {
			goto('/new');
		} else {
			setTimeout(() => {
				$showForm = true;
			}, 300);
			
			document.getElementById('pcKey')?.addEventListener('keypress', async (ev) => {
				if (ev.code == 'Enter') await createIndex();
			});

			ripples.push(createRipple(0, 0));
			setTimeout(() => {
				ripples.push(createRipple(7.5, 7.5));
			}, 1500);
		}
	});
</script>

{#if $showForm}
	<div class="connection-container" in:fade={{ duration: 600, delay: 200 }}>
		<div class="connection-form" in:fly={{ y: 50, duration: 800, easing: elasticOut }}>
			<h1 in:slide={{ duration: 600, delay: 400 }}>{data.title}</h1>
			
			<div class="form-group" in:fly={{ x: -30, duration: 500, delay: 600 }}>
				<label for="pcKey">Pinecone API Key</label>
				<input
					id="pcKey"
					type="password"
					placeholder="Enter your Pinecone API Key"
					maxlength="200"
					bind:value={$apiKey}
					disabled={$isConnecting}
				/>
			</div>
			
			<div class="form-row">
				<div class="form-group" in:fly={{ x: -30, duration: 500, delay: 700 }}>
					<label for="cloud">Cloud Provider</label>
					<select id="cloud" bind:value={$cloud} disabled={$isConnecting}>
						<option value="aws">AWS</option>
						<option value="gcp">Google Cloud</option>
						<option value="azure">Azure</option>
					</select>
				</div>
				
				<div class="form-group" in:fly={{ x: 30, duration: 500, delay: 700 }}>
					<label for="region">Region</label>
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
				in:fly={{ y: 30, duration: 600, delay: 800 }}
			>
				{#if $isConnecting}
					<span class="spinner"></span>
					Connecting...
				{:else}
					Connect to Pinecone
				{/if}
			</button>
		</div>
	</div>
{/if}

<style>
	/* Modern connection form with glassmorphism */
	.connection-container {
		width: 100%;
		max-width: 500px;
		margin: 0 auto;
		padding: 2rem;
	}

	.connection-form {
		background: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(20px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 24px;
		padding: 3rem;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
	}

	:global(body.light-mode) .connection-form {
		background: rgba(255, 255, 255, 0.8);
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.05);
	}

	h1 {
		font-size: clamp(2.5rem, 6vw, 4rem);
		font-weight: 700;
		text-align: center;
		margin-bottom: 2rem;
		background: linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		letter-spacing: -0.02em;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
		font-size: 0.875rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		opacity: 0.8;
	}

	input, select {
		width: 100%;
		padding: 1rem 1.25rem;
		font-size: 1rem;
		border: 2px solid rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		background: rgba(255, 255, 255, 0.05);
		color: inherit;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		font-family: inherit;
	}

	:global(body.light-mode) input,
	:global(body.light-mode) select {
		background: rgba(255, 255, 255, 0.8);
		border: 2px solid rgba(0, 0, 0, 0.1);
	}

	input:focus, select:focus {
		outline: none;
		border-color: #6366f1;
		background: rgba(99, 102, 241, 0.1);
		transform: translateY(-2px);
		box-shadow: 0 10px 25px rgba(99, 102, 241, 0.2);
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

	/* Enhanced connect button with animations */
	.connect-button {
		width: 100%;
		padding: 1.25rem 2rem;
		font-size: 1.1rem;
		font-weight: 600;
		border: none;
		border-radius: 12px;
		background: linear-gradient(135deg, #6366f1, #8b5cf6);
		color: white;
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
		overflow: hidden;
		margin-top: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.connect-button:hover:not(:disabled) {
		transform: translateY(-3px);
		box-shadow: 0 15px 35px rgba(99, 102, 241, 0.4);
		background: linear-gradient(135deg, #5855eb, #7c3aed);
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

	/* Enhanced ripple effects */
	:global(.ripple) {
		position: fixed;
		width: 20px;
		height: 20px;
		z-index: -1;
		background: rgba(26, 24, 24, 0);
		border: 1.5vw dashed #6366f1;
		border-radius: 50%;
		transform: scale(0);
		animation:
			ripple-effect 1.5s linear forwards,
			rotate-forever 8s linear infinite 1.5s;
	}

	:global(body.light-mode) :global(.ripple) {
		border-color: #8b5cf6;
	}

	@keyframes ripple-effect {
		to {
			transform: scale(0.33);
			opacity: 0.6;
		}
	}

	@keyframes rotate-forever {
		from {
			transform: rotate(0deg) scale(0.33);
		}
		to {
			transform: rotate(360deg) scale(0.33);
		}
	}

	/* Responsive design */
	@media (max-width: 768px) {
		.connection-container {
			padding: 1rem;
		}

		.connection-form {
			padding: 2rem;
		}

		.form-row {
			grid-template-columns: 1fr;
		}

		h1 {
			font-size: 2.5rem;
		}
	}

	/* Reduced motion support */
	@media (prefers-reduced-motion: reduce) {
		.connect-button:hover:not(:disabled) {
			transform: none;
		}
		
		:global(.ripple) {
			animation: none;
		}
	}
</style>
