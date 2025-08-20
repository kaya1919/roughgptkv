<script>
	import { onMount } from 'svelte';
	import { fade, fly, slide } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { getContext } from 'svelte';

	const theme = getContext('theme');
	
	let notes = $state([
		{ id: 1, title: 'Welcome Note', content: 'This is your first note!', category: 'Personal', createdAt: new Date() },
		{ id: 2, title: 'Project Ideas', content: 'List of project ideas for the weekend', category: 'Work', createdAt: new Date() },
		{ id: 3, title: 'Shopping List', content: 'Milk, Bread, Eggs', category: 'Personal', createdAt: new Date() }
	]);
	
	let searchQuery = $state('');
	let selectedCategory = $state('All');
	let showAddForm = $state(false);
	let newNote = $state({ title: '', content: '', category: 'Personal' });

	const categories = ['All', 'Personal', 'Work', 'Ideas', 'Tasks'];

	let filteredNotes = $derived.by(() => {
		return notes.filter(note => {
			const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
								 note.content.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesCategory = selectedCategory === 'All' || note.category === selectedCategory;
			return matchesSearch && matchesCategory;
		});
	});

	$effect(() => {
		localStorage.setItem('roughgpt-notes', JSON.stringify(notes));
	});

	function addNote() {
		if (newNote.title.trim() && newNote.content.trim()) {
			notes = [...notes, {
				id: Date.now(),
				...newNote,
				createdAt: new Date()
			}];
			newNote = { title: '', content: '', category: 'Personal' };
			showAddForm = false;
		}
	}

	function deleteNote(id) {
		notes = notes.filter(note => note.id !== id);
	}

	onMount(() => {
		// Load notes from localStorage if available
		const savedNotes = localStorage.getItem('roughgpt-notes');
		if (savedNotes) {
			notes = JSON.parse(savedNotes);
		}
	});
</script>

<div class="notes-container" in:fade={{ duration: 400 }}>
	<!-- Search and filter header -->
	<header class="notes-header" in:slide={{ duration: 500 }}>
		<h1>Your Notes</h1>
		
		<div class="controls">
			<div class="search-container" in:fly={{ x: -30, duration: 400, delay: 200 }}>
				<input
					type="text"
					placeholder="Search notes..."
					bind:value={searchQuery}
					class="search-input"
				/>
			</div>
			
			<div class="category-filter" in:fly={{ x: 30, duration: 400, delay: 300 }}>
				{#each categories as category}
					<button
						class="category-pill"
						class:active={selectedCategory === category}
						onclick={() => selectedCategory = category}
					>
						{category}
					</button>
				{/each}
			</div>
		</div>
		
		<button 
			class="add-note-btn"
			onclick={() => showAddForm = !showAddForm}
			in:fly={{ y: 30, duration: 400, delay: 400 }}
		>
			+ Add Note
		</button>
	</header>

	<!-- Add note form with smooth transitions -->
	{#if showAddForm}
		<div class="add-form" in:slide={{ duration: 300 }} out:slide={{ duration: 200 }}>
			<input
				type="text"
				placeholder="Note title..."
				bind:value={newNote.title}
				class="form-input"
			/>
			<textarea
				placeholder="Write your note..."
				bind:value={newNote.content}
				class="form-textarea"
			></textarea>
			<div class="form-controls">
				<select bind:value={newNote.category} class="form-select">
					{#each categories.slice(1) as category}
						<option value={category}>{category}</option>
					{/each}
				</select>
				<div class="form-buttons">
					<button onclick={() => showAddForm = false} class="cancel-btn">Cancel</button>
					<button onclick={addNote} class="save-btn">Save Note</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Notes grid with animations -->
	<div class="notes-grid">
		{#each filteredNotes as note (note.id)}
			<div 
				class="note-card" 
				in:fly={{ y: 50, duration: 400 }}
				out:fly={{ y: -50, duration: 300 }}
				animate:flip={{ duration: 300 }}
			>
				<div class="note-header">
					<h3>{note.title}</h3>
					<span class="category-tag">{note.category}</span>
				</div>
				<p class="note-content">{note.content}</p>
				<div class="note-footer">
					<span class="note-date">
						{note.createdAt.toLocaleDateString()}
					</span>
					<button 
						class="delete-btn"
						onclick={() => deleteNote(note.id)}
					>
						Delete
					</button>
				</div>
			</div>
		{/each}
	</div>

	{#if filteredNotes.length === 0}
		<div class="empty-state" in:fade={{ duration: 400 }}>
			<h3>No notes found</h3>
			<p>Try adjusting your search or category filter</p>
		</div>
	{/if}
</div>

<style>
	.notes-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		min-height: 100vh;
	}

	/* Modern header with search and filters */
	.notes-header {
		margin-bottom: 2rem;
		text-align: center;
	}

	.notes-header h1 {
		font-size: 3rem;
		font-weight: 700;
		margin-bottom: 2rem;
		background: linear-gradient(135deg, #6366f1, #8b5cf6);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.controls {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-bottom: 2rem;
		align-items: center;
	}

	.search-container {
		width: 100%;
		max-width: 400px;
	}

	.search-input {
		width: 100%;
		padding: 1rem 1.5rem;
		font-size: 1rem;
		border: 2px solid rgba(255, 255, 255, 0.1);
		border-radius: 50px;
		background: rgba(255, 255, 255, 0.05);
		color: inherit;
		transition: all 0.3s ease;
	}

	:global(body.light-mode) .search-input {
		background: rgba(255, 255, 255, 0.8);
		border-color: rgba(0, 0, 0, 0.1);
	}

	.search-input:focus {
		outline: none;
		border-color: #6366f1;
		box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
	}

	.category-filter {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		justify-content: center;
	}

	.category-pill {
		padding: 0.5rem 1rem;
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 25px;
		background: transparent;
		color: inherit;
		cursor: pointer;
		transition: all 0.3s ease;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.category-pill:hover {
		border-color: #6366f1;
		background: rgba(99, 102, 241, 0.1);
	}

	.category-pill.active {
		background: #6366f1;
		color: white;
		border-color: #6366f1;
	}

	.add-note-btn {
		padding: 1rem 2rem;
		background: linear-gradient(135deg, #6366f1, #8b5cf6);
		color: white;
		border: none;
		border-radius: 50px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.add-note-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 10px 25px rgba(99, 102, 241, 0.3);
	}

	/* Add form styling */
	.add-form {
		background: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(20px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 16px;
		padding: 2rem;
		margin-bottom: 2rem;
	}

	:global(body.light-mode) .add-form {
		background: rgba(255, 255, 255, 0.8);
		border-color: rgba(0, 0, 0, 0.1);
	}

	.form-input, .form-textarea, .form-select {
		width: 100%;
		padding: 1rem;
		margin-bottom: 1rem;
		border: 2px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.05);
		color: inherit;
		font-family: inherit;
	}

	.form-textarea {
		min-height: 120px;
		resize: vertical;
	}

	.form-controls {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}

	.form-buttons {
		display: flex;
		gap: 0.5rem;
	}

	.cancel-btn, .save-btn {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-weight: 500;
		transition: all 0.3s ease;
	}

	.cancel-btn {
		background: rgba(255, 255, 255, 0.1);
		color: inherit;
	}

	.save-btn {
		background: #6366f1;
		color: white;
	}

	/* Notes grid with modern card design */
	.notes-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.note-card {
		background: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(20px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 16px;
		padding: 1.5rem;
		transition: all 0.3s ease;
	}

	:global(body.light-mode) .note-card {
		background: rgba(255, 255, 255, 0.8);
		border-color: rgba(0, 0, 0, 0.1);
	}

	.note-card:hover {
		transform: translateY(-5px);
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
	}

	.note-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1rem;
	}

	.note-header h3 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
	}

	.category-tag {
		background: rgba(99, 102, 241, 0.2);
		color: #6366f1;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.note-content {
		margin: 0 0 1rem 0;
		line-height: 1.6;
		opacity: 0.8;
	}

	.note-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.875rem;
	}

	.note-date {
		opacity: 0.6;
	}

	.delete-btn {
		background: rgba(239, 68, 68, 0.1);
		color: #ef4444;
		border: 1px solid rgba(239, 68, 68, 0.3);
		padding: 0.5rem 1rem;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.delete-btn:hover {
		background: #ef4444;
		color: white;
	}

	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		opacity: 0.6;
	}

	/* Responsive design */
	@media (max-width: 768px) {
		.notes-container {
			padding: 1rem;
		}

		.controls {
			gap: 1rem;
		}

		.category-filter {
			gap: 0.25rem;
		}

		.form-controls {
			flex-direction: column;
			align-items: stretch;
		}

		.notes-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
