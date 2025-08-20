<!-- <script>
	/**
	 * @param {{ target: any; }} event
	 */
	function resizeTextarea(event) {
		const textarea = event.target;
		const newFontSize = 14 - Math.sqrt(textarea.value.length) * 0.8;
		const fontSize = (newFontSize < 2 ? 2 : newFontSize) + ((window.innerWidth / window.innerHeight)<1?'vw':'vh');
		textarea.style.fontSize = fontSize;
		textarea.style.height = 'auto'; // Reset height
		textarea.style.height = textarea.scrollHeight + 'px'; // Adjust height based on content
	}

	async function insertNote() {
		const textbox = window.document.getElementById("textbox");
		const textboxText = textbox?.value;
		if (textboxText.trim() == "")
			return null;
		textbox.setAttribute('placeholder', "Saving....");
		textbox.value = "";
		const response = await fetch('/insert-note', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ apiKey: localStorage.getItem("apiKey"), fullText: textboxText})
		});

		const result = await response.json();
		if (result.error) {
			textbox.setAttribute('placeholder', "Failed to save.");
			alert(result.error);
		} else {
			textbox.setAttribute('placeholder', "Saved!");
		}
	}
</script>

<main class="container">
	<textarea id="textbox" cols="30" rows="30" placeholder="Write Here!" oninput={resizeTextarea}></textarea>
	<button class="save-btn" onclick={insertNote}>Save</button>
</main>

<style>
	@property --angle {
		syntax: '<angle>';
		initial-value: 0deg;
		inherits: false;
	}

	:global(body.dark-mode) .container {
		--angle: 0deg;
		background: linear-gradient(var(--angle), #778fdd, #a7bfff, #c7efff);
		animation: rotateGradient 8s linear infinite;
		background-size: 100% 100%;
	}

	@keyframes gradientAnimation {
		0% {
			background-position: 0% 50%;
		}
		50% {
			background-position: 100% 50%;
		}
		100% {
			background-position: 0% 50%;
		}
	}
	@keyframes rotateGradient {
		from {
			--angle: 0deg;
		}
		to {
			--angle: 360deg;
		}
	}

	.container {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 2rem;
		margin-bottom: auto;
		width: 70vw;
		max-width: 80vw;
		height: 55vh;
		margin-left: auto;
		margin-right: auto;
		--angle: 0deg;
		background: linear-gradient(var(--angle), #d3b251, #a38221, #735200);
		animation: rotateGradient 8s linear infinite;
		background-size: 100% 100%;
		border-radius: 1.4rem;
		box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
	}

	.save-btn {
		background: white;
		letter-spacing: 0.32ch;
		border-color: black;
		color: black;
	}

	:global(body.dark-mode) .save-btn {
		background: #000000;
		border-color: white;
		color: white;
	}

	.save-btn:hover {
		transform: scale(1.05);
	}

	.save-btn {
		margin: 1rem 0;
		padding: 1rem;
		border-radius: 1.4rem;
		border: 2px solid black;
		font-size: 20px;
		font-weight: 800;
		cursor: pointer;
		transition: all 0.3s ease-in-out;
		width: 90%;
	}

	textarea {
		background-color: transparent;
		color: white;
		width: 100%;
		max-width: 80%;
		min-height: 60%;
		border-radius: 1rem;
		border: none;
		outline: none;
		text-align: justify;
		align-content: center;
		padding: 1rem;
		font-size: min(14vw, 14vh);
		transition: border 0.1s ease-in-out;
		resize: none;
		overflow-y: hidden; /* Hides scrollbar while auto-expanding */
	}

	textarea::placeholder {
		color: white;
		text-align: center;
		font-size: min(14vh, 14vw);
	}

	:global(body.dark-mode) textarea::placeholder {
		color: black;
	}

	:global(body.dark-mode) textarea {
		color: black;
	}

	@media (max-aspect-ratio: 3/2) {
		
	}
</style> -->
<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { fade } from 'svelte/transition';

	onMount(() => {
		// Redirect to notes if not authenticated
		if (!localStorage.getItem('apiKey')) {
			goto('/');
		}
	});

	// Auto-redirect to notes page
	setTimeout(() => {
		goto('/notes');
	}, 1000);
</script>

<div class="redirect-container" in:fade={{ duration: 400 }}>
	<h1>Redirecting to Notes...</h1>
	<p>Setting up your workspace...</p>
</div>

<style>
	.redirect-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 50vh;
		text-align: center;
	}

	h1 {
		font-size: 2rem;
		margin-bottom: 1rem;
		background: linear-gradient(135deg, #6366f1, #8b5cf6);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	p {
		opacity: 0.7;
		font-size: 1.1rem;
	}
</style>
