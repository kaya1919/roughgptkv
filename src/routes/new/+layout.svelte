<script lang="ts">
	import { goto } from '$app/navigation';
    import { onMount } from "svelte";
	
    /**
	 * @param {Event} ev
	 */
	function handle(ev: Event) {
		const searchInput = window.document.getElementById('search-input') as HTMLInputElement;
		if (searchInput.value == '') goto('/new');
	}

	function handleSearch(ev: KeyboardEvent) {
		if (ev.key === 'Enter') {
			// Cancel the default action, if needed
			ev.preventDefault();
			const searchInput = window.document.getElementById('search-input') as HTMLInputElement;
			if (searchInput.value != ''){
                sessionStorage.setItem("query", searchInput.value);
				window.dispatchEvent(new Event('query-changed'));
                goto('/new/search');
            }
		}
	}

	let { children } = $props();

    onMount(()=>{
		if (!localStorage.getItem("apiKey"))
			goto("/");
	});
</script>

<div class="outer-container">
	<div class="search-div">
		<img src="/search.svg" alt="search" /><input
			id="search-input"
			placeholder="Search & <Enter>"
			oninput={handle}
			onkeypress={handleSearch}
		/>
	</div>
	{@render children()}
</div>

<style>
	:global(body) {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.outer-container {
		display: flex;
		margin-top: 2rem;
		margin-bottom: auto;
        width: 73.5vw;
		flex-direction: column;
		align-items: center;
	}

	.search-div {
		display: flex;
		flex-direction: row;
		justify-content: center;
		margin: 1rem 0;
		padding: 1rem;
		border-radius: 1.4rem;
		border: 2px solid black;
		font-size: 20px;
		font-weight: 800;
		cursor: pointer;
		transition: all 0.3s ease-in-out;
	}

	.search-div {
		background: #00000022;
		width: fit-content;
		margin-right: auto;
		border-color: black;
	}

	:global(body.dark-mode) .search-div {
		filter: invert(1);
	}

	.search-div:hover {
		transform: scale(1.05);
	}

	.search-div img {
		height: 3vh;
	}

	.search-div input {
		height: 3vh;
		color: black;
		background-color: transparent;
		border: none;
		font-size: medium;
		font-weight: 480;
		letter-spacing: 0.2ch;
		outline: none;
        width: 9vw;
		margin-left: 0.4vw;
	}

    :global(body.dark-mode) .search-div input {
        color: white;
        filter: invert(1);
    }

    :global(body.dark-mode) .search-div input::placeholder {
        color: white;
    }

	.search-div input::placeholder {
		color: black;
	}

	@media (max-aspect-ratio: 3/2) {
		.search-div input {
            width: 26vw;
            margin-left: 0.8vw;
        }
	}

    /* Responsive design for smaller resolutions */
	@media (max-height: 768px) {
		.outer-container {
			margin-top: 0;
		}

        .search-div input {
            margin-left:1ch;
            width: fit-content;
        }
	}
</style>
