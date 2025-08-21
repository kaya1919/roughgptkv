<script>
	import { onMount } from 'svelte';
	import { fade, fly, slide, scale } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { getContext } from 'svelte';
	import { goto } from '$app/navigation';

	const theme = getContext('theme');
	
	// User profile state
	let userProfile = $state({
		name: 'Mind Explorer',
		avatar: 'brain',
		streak: 0,
		totalNotes: 0,
		lastActivity: null
	});
	
	// Notes state with enhanced structure
	let notes = $state([]);
	let tasks = $state([]);
	let deletedItems = $state([]); // Recently deleted items
	
	// UI state
	let searchQuery = $state('');
	let selectedCategory = $state('All');
	let showAddForm = $state(false);
	let showProfileEdit = $state(false);
	let showDeletedItems = $state(false);
	let viewMode = $state('grid');
	
	// New note form
	let newNote = $state({ 
		title: '', 
		content: '', 
		category: 'personal',
		type: 'note',
		isCompleted: false,
		priority: 'medium'
	});

	// Categories with icons and colors
	const categories = [
		{ id: 'all', name: 'All', icon: 'grid', color: '#6366f1' },
		{ id: 'personal', name: 'Personal', icon: 'user', color: '#8b5cf6' },
		{ id: 'professional', name: 'Professional', icon: 'briefcase', color: '#06b6d4' },
		{ id: 'educational', name: 'Educational', icon: 'book', color: '#10b981' },
		{ id: 'songs', name: 'Songs', icon: 'music', color: '#f59e0b' },
		{ id: 'recipes', name: 'Recipes', icon: 'chef', color: '#ef4444' }
	];

	// Available avatar options
	const avatarOptions = [
		{ id: 'brain', name: 'Brain', icon: 'brain' },
		{ id: 'star', name: 'Star', icon: 'star' },
		{ id: 'heart', name: 'Heart', icon: 'heart' },
		{ id: 'lightning', name: 'Lightning', icon: 'lightning' },
		{ id: 'moon', name: 'Moon', icon: 'moon' },
		{ id: 'sun', name: 'Sun', icon: 'sun' }
	];

	// Filter and search logic
	let filteredNotes = $derived.by(() => {
		return notes.filter(note => {
			const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
								 note.content.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesCategory = selectedCategory === 'all' || note.category === selectedCategory;
			return matchesSearch && matchesCategory;
		});
	});

	let filteredTasks = $derived.by(() => {
		return tasks.filter(task => {
			const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
								 task.content.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesCategory = selectedCategory === 'all' || task.category === selectedCategory;
			return matchesSearch && matchesCategory;
		});
	});

	// Streak calculation
	function calculateStreak() {
		const today = new Date().toDateString();
		const completedToday = tasks.filter(task => 
			task.isCompleted && 
			new Date(task.completedAt).toDateString() === today
		).length;
		
		if (completedToday > 0) {
			updateStreak();
		}
	}

	function updateStreak() {
		const lastActivity = localStorage.getItem('lastActivity');
		const today = new Date().toDateString();
		
		if (lastActivity !== today) {
			userProfile.streak += 1;
			userProfile.lastActivity = today;
			localStorage.setItem('lastActivity', today);
			localStorage.setItem('userStreak', userProfile.streak.toString());
		}
	}

	// Add new note/task
	function addNote() {
		if (newNote.title.trim() && newNote.content.trim()) {
			const noteData = {
				id: Date.now(),
				...newNote,
				createdAt: new Date(),
				updatedAt: new Date()
			};

			if (newNote.type === 'task') {
				tasks = [...tasks, noteData];
			} else {
				notes = [...notes, noteData];
			}

			userProfile.totalNotes += 1;
			newNote = { 
				title: '', 
				content: '', 
				category: 'personal',
				type: 'note',
				isCompleted: false,
				priority: 'medium'
			};
			showAddForm = false;
			saveData();
		}
	}

	// Toggle task completion
	function toggleTask(taskId) {
		tasks = tasks.map(task => {
			if (task.id === taskId) {
				const wasCompleted = task.isCompleted;
				task.isCompleted = !task.isCompleted;
				task.completedAt = task.isCompleted ? new Date() : null;
				
				if (!wasCompleted && task.isCompleted) {
					updateStreak();
				}
			}
			return task;
		});
		saveData();
	}

	// Delete note/task with recently deleted functionality
	function deleteItem(id, type) {
		let deletedItem;
		
		if (type === 'task') {
			const taskIndex = tasks.findIndex(task => task.id === id);
			if (taskIndex > -1) {
				deletedItem = { ...tasks[taskIndex], type: 'task', deletedAt: new Date() };
				tasks = tasks.filter(task => task.id !== id);
			}
		} else {
			const noteIndex = notes.findIndex(note => note.id === id);
			if (noteIndex > -1) {
				deletedItem = { ...notes[noteIndex], type: 'note', deletedAt: new Date() };
				notes = notes.filter(note => note.id !== id);
			}
		}

		if (deletedItem) {
			deletedItems = [deletedItem, ...deletedItems].slice(0, 20); // Keep only last 20
			userProfile.totalNotes = Math.max(0, userProfile.totalNotes - 1);
		}
		
		saveData();
	}

	// Restore from recently deleted
	function restoreItem(id) {
		const itemIndex = deletedItems.findIndex(item => item.id === id);
		if (itemIndex > -1) {
			const item = deletedItems[itemIndex];
			const { deletedAt, ...restoredItem } = item;
			
			if (item.type === 'task') {
				tasks = [...tasks, restoredItem];
			} else {
				notes = [...notes, restoredItem];
			}
			
			deletedItems = deletedItems.filter(item => item.id !== id);
			userProfile.totalNotes += 1;
			saveData();
		}
	}

	// Permanently delete from recently deleted
	function permanentlyDelete(id) {
		deletedItems = deletedItems.filter(item => item.id !== id);
		saveData();
	}

	// Save data to localStorage
	function saveData() {
		localStorage.setItem('mindnotes-notes', JSON.stringify(notes));
		localStorage.setItem('mindnotes-tasks', JSON.stringify(tasks));
		localStorage.setItem('mindnotes-deleted', JSON.stringify(deletedItems));
		localStorage.setItem('mindnotes-profile', JSON.stringify(userProfile));
	}

	// Load data from localStorage
	function loadData() {
		const savedNotes = localStorage.getItem('mindnotes-notes');
		const savedTasks = localStorage.getItem('mindnotes-tasks');
		const savedDeleted = localStorage.getItem('mindnotes-deleted');
		const savedProfile = localStorage.getItem('mindnotes-profile');
		const savedStreak = localStorage.getItem('userStreak');
		
		if (savedNotes) {
			notes = JSON.parse(savedNotes);
		}
		
		if (savedTasks) {
			tasks = JSON.parse(savedTasks);
		}
		
		if (savedDeleted) {
			deletedItems = JSON.parse(savedDeleted);
		}
		
		if (savedProfile) {
			userProfile = { ...userProfile, ...JSON.parse(savedProfile) };
		}
		
		if (savedStreak) {
			userProfile.streak = parseInt(savedStreak);
		}
	}

	// Update profile
	function updateProfile() {
		showProfileEdit = false;
		saveData();
	}

	// Check connection and redirect if needed
	function checkConnection() {
		const apiKey = localStorage.getItem('pinecone_api_key');
		const connectionTime = localStorage.getItem('connection_timestamp');
		
		if (!apiKey || !connectionTime) {
			goto('/');
			return false;
		}
		
		// Check if connection is recent (within 24 hours)
		const isRecentConnection = (Date.now() - parseInt(connectionTime)) < 24 * 60 * 60 * 1000;
		if (!isRecentConnection) {
			goto('/');
			return false;
		}
		
		return true;
	}

	// Get SVG icon
	function getIcon(iconName, size = 24) {
		const icons = {
			brain: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><path d="M12 2C13.1 2 14 2.9 14 4C14 4.74 13.6 5.39 13 5.73V7C13 8.1 13.9 9 15 9C16.1 9 17 8.1 17 7V6C17 4.9 17.9 4 19 4C20.1 4 21 4.9 21 6V7C21 8.86 20.11 10.5 18.7 11.35C18.89 11.88 19 12.43 19 13C19 15.76 16.76 18 14 18H10C7.24 18 5 15.76 5 13C5 12.43 5.11 11.88 5.3 11.35C3.89 10.5 3 8.86 3 7V6C3 4.9 3.9 4 5 4C6.1 4 7 4.9 7 6V7C7 8.1 7.9 9 9 9C10.1 9 11 8.1 11 7V5.73C10.4 5.39 10 4.74 10 4C10 2.9 10.9 2 12 2Z" fill="currentColor"/></svg>`,
			grid: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><path d="M10 3H4C3.45 3 3 3.45 3 4V10C3 10.55 3.45 11 4 11H10C10.55 11 11 10.55 11 10V4C11 3.45 10.55 3 10 3ZM10 13H4C3.45 13 3 13.45 3 14V20C3 20.55 3.45 21 4 21H10C10.55 21 11 20.55 11 20V14C11 13.45 10.55 13 10 13ZM20 3H14C13.45 3 13 3.45 13 4V10C13 10.55 13.45 11 14 11H20C20.55 11 21 10.55 21 10V4C21 3.45 20.55 3 20 3ZM20 13H14C13.45 13 13 13.45 13 14V20C13 20.55 13.45 21 14 21H20C20.55 21 21 20.55 21 20V14C21 13.45 20.55 13 20 13Z" fill="currentColor"/></svg>`,
			user: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 7.01C14.8 7.01 14.6 7.1 14.5 7.3L13.5 9.2C13.1 10 12.4 10.6 11.5 10.9L11.5 16L8.5 16C7.7 16 7 16.7 7 17.5S7.7 19 8.5 19L15.5 19C16.3 19 17 18.3 17 17.5S16.3 16 15.5 16L13.5 16L13.5 12.5C13.9 12.2 14.2 11.8 14.4 11.3L15.2 9.4C15.6 8.4 16.6 7.8 17.7 8L21 8.3V9H21Z" fill="currentColor"/></svg>`,
			briefcase: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><path d="M10 2H14C15.1 2 16 2.9 16 4V6H20C21.1 6 22 6.9 22 8V19C22 20.1 21.1 21 20 21H4C2.9 21 2 20.1 2 19V8C2 6.9 2.9 6 4 6H8V4C8 2.9 8.9 2 10 2ZM14 6V4H10V6H14Z" fill="currentColor"/></svg>`,
			book: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM17 7H7V9H17V7ZM17 11H7V13H17V11ZM14 15H7V17H14V15Z" fill="currentColor"/></svg>`,
			music: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><path d="M12 3V13.55C11.41 13.21 10.73 13 10 13C7.79 13 6 14.79 6 17S7.79 21 10 21S14 19.21 14 17V7H18V3H12Z" fill="currentColor"/></svg>`,
			chef: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><path d="M12.5 1.5C12.5 2.33 11.83 3 11 3S9.5 2.33 9.5 1.5 10.17 0 11 0 12.5 0.67 12.5 1.5ZM8.5 4C8.5 4.83 7.83 5.5 7 5.5S5.5 4.83 5.5 4 6.17 2.5 7 2.5 8.5 3.17 8.5 4ZM14.5 4C14.5 4.83 15.17 5.5 16 5.5S17.5 4.83 17.5 4 16.83 2.5 16 2.5 14.5 3.17 14.5 4ZM18.5 7C18.5 7.83 17.83 8.5 17 8.5S15.5 7.83 15.5 7 16.17 5.5 17 5.5 18.5 6.17 18.5 7ZM4.5 7C4.5 7.83 5.17 8.5 6 8.5S7.5 7.83 7.5 7 6.83 5.5 6 5.5 4.5 6.17 4.5 7ZM19 13V20C19 21.1 18.1 22 17 22H7C5.9 22 5 21.1 5 20V13C5 11.9 5.9 11 7 11H17C18.1 11 19 11.9 19 13ZM17 13H7V20H17V13Z" fill="currentColor"/></svg>`,
			star: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z" fill="currentColor"/></svg>`,
			heart: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z" fill="currentColor"/></svg>`,
			lightning: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><path d="M7 2V13H10V22L17 10H13L17 2H7Z" fill="currentColor"/></svg>`,
			moon: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><path d="M12 3C12.39 3 12.76 3.02 13.13 3.07C10.27 4.72 8.5 7.97 8.5 11.5S10.27 18.28 13.13 19.93C12.76 19.98 12.39 20 12 20C7.03 20 3 15.97 3 11S7.03 2 12 3Z" fill="currentColor"/></svg>`,
			sun: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><path d="M12 7C9.24 7 7 9.24 7 12S9.24 17 12 17S17 14.76 17 12S14.76 7 12 7ZM2 13H4C4.55 13 5 12.55 5 12S4.55 11 4 11H2C1.45 11 1 11.45 1 12S1.45 13 2 13ZM20 13H22C22.55 13 23 12.55 23 12S22.55 11 22 11H20C19.45 11 19 11.45 19 12S19.45 13 20 13ZM11 2V4C11 4.55 11.45 5 12 5S13 4.55 13 4V2C13 1.45 12.55 1 12 1S11 1.45 11 2ZM11 20V22C11 22.55 11.45 23 12 23S13 22.55 13 22V20C13 19.45 12.55 19 12 19S11 19.45 11 20Z" fill="currentColor"/></svg>`,
			search: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><path d="M15.5 14H14.71L14.43 13.73C15.41 12.59 16 11.11 16 9.5C16 5.91 13.09 3 9.5 3S3 5.91 3 9.5S5.91 16 9.5 16C11.11 16 12.59 15.41 13.73 14.43L14 14.71V15.5L19 20.49L20.49 19L15.5 14ZM9.5 14C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5S14 7.01 14 9.5S11.99 14 9.5 14Z" fill="currentColor"/></svg>`,
			plus: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><path d="M19 13H13V19C13 19.55 12.55 20 12 20S11 19.55 11 19V13H5C4.45 13 4 12.55 4 12S4.45 11 5 11H11V5C11 4.45 11.45 4 12 4S13 4.45 13 5V11H19C19.55 11 20 11.45 20 12S19.55 13 19 13Z" fill="currentColor"/></svg>`,
			check: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor"/></svg>`,
			trash: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><path d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM19 4H15.5L14.5 3H9.5L8.5 4H5V6H19V4Z" fill="currentColor"/></svg>`,
			restore: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><path d="M12 5V1L7 6L12 11V7C15.31 7 18 9.69 18 13S15.31 19 12 19S6 16.31 6 13H4C4 17.42 7.58 21 12 21S20 17.42 20 13S16.42 5 12 5Z" fill="currentColor"/></svg>`,
			fire: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><path d="M13.5 0.67S10.04 3.15 10.04 6.5C10.04 7.41 10.54 8.23 11.34 8.65C11.56 8.77 11.8 8.84 12.04 8.84C13.14 8.84 14.04 7.94 14.04 6.84C14.04 6.64 14 6.44 13.92 6.26C13.92 6.26 13.5 5.26 13.5 4.84S13.92 4.42 13.92 4.42C13.92 4.42 15.5 2.67 15.5 0.67C15.5 0.3 15.2 0 14.83 0H14.17C13.8 0 13.5 0.3 13.5 0.67Z" fill="currentColor"/></svg>`
		};
		return icons[iconName] || icons.brain;
	}

	onMount(() => {
		if (!checkConnection()) return;
		
		loadData();
		calculateStreak();
		
		// Auto-save periodically
		const saveInterval = setInterval(saveData, 30000);
		
		return () => {
			clearInterval(saveInterval);
		};
	});
</script>

<div class="notes-app" in:fade={{ duration: 400 }}>
	<!-- Header with user profile and controls -->
	<header class="app-header" in:slide={{ duration: 500 }}>
		<div class="header-content">
			<div class="user-profile" onclick={() => showProfileEdit = true}>
				<div class="avatar">
					{@html getIcon(userProfile.avatar, 28)}
				</div>
				<div class="user-info">
					<h2>{userProfile.name}</h2>
					<div class="stats">
						<span class="streak">
							{@html getIcon('fire', 16)}
							{userProfile.streak} day streak
						</span>
						<span class="notes-count">{userProfile.totalNotes} notes</span>
					</div>
				</div>
			</div>
			
			<div class="header-controls">
				<div class="search-container">
					<div class="search-icon">{@html getIcon('search', 20)}</div>
					<input
						type="text"
						placeholder="Search your mind..."
						bind:value={searchQuery}
						class="search-input"
					/>
				</div>
				
				<button 
					class="add-btn primary"
					onclick={() => showAddForm = !showAddForm}
				>
					{@html getIcon('plus', 20)}
					Add Note
				</button>
				
				<button 
					class="deleted-btn secondary"
					onclick={() => showDeletedItems = !showDeletedItems}
					title="Recently Deleted"
				>
					{@html getIcon('trash', 20)}
					{#if deletedItems.length > 0}
						<span class="deleted-count">{deletedItems.length}</span>
					{/if}
				</button>
			</div>
		</div>
		
		<!-- Category Filter -->
		<div class="category-filter">
			{#each categories as category}
				<button
					class="category-pill"
					class:active={selectedCategory === category.id}
					style="--category-color: {category.color}"
					onclick={() => selectedCategory = category.id}
				>
					{@html getIcon(category.icon, 16)}
					{category.name}
				</button>
			{/each}
		</div>
	</header>

	<!-- Add Note/Task Form -->
	{#if showAddForm}
		<div class="add-form-overlay" in:fade={{ duration: 200 }} onclick={() => showAddForm = false}>
			<div class="add-form" in:scale={{ duration: 300 }} onclick={(e) => e.stopPropagation()}>
				<h3>Create New {newNote.type === 'task' ? 'Task' : 'Note'}</h3>
				
				<div class="form-tabs">
					<button 
						class="tab-btn"
						class:active={newNote.type === 'note'}
						onclick={() => newNote.type = 'note'}
					>
						{@html getIcon('book', 18)}
						Note
					</button>
					<button 
						class="tab-btn"
						class:active={newNote.type === 'task'}
						onclick={() => newNote.type = 'task'}
					>
						{@html getIcon('check', 18)}
						Task
					</button>
				</div>
				
				<input
					type="text"
					placeholder="{newNote.type === 'task' ? 'Task' : 'Note'} title..."
					bind:value={newNote.title}
					class="form-input"
				/>
				
				<textarea
					placeholder="Write your {newNote.type === 'task' ? 'task details' : 'thoughts'}..."
					bind:value={newNote.content}
					class="form-textarea"
				></textarea>
				
				<div class="form-row">
					<select bind:value={newNote.category} class="form-select black-text">
						{#each categories.slice(1) as category}
							<option value={category.id}>{category.name}</option>
						{/each}
					</select>
					
					{#if newNote.type === 'task'}
						<select bind:value={newNote.priority} class="form-select black-text">
							<option value="low">Low Priority</option>
							<option value="medium">Medium Priority</option>
							<option value="high">High Priority</option>
						</select>
					{/if}
				</div>
				
				<div class="form-actions">
					<button onclick={() => showAddForm = false} class="btn secondary">Cancel</button>
					<button onclick={addNote} class="btn primary">
						Save {newNote.type === 'task' ? 'Task' : 'Note'}
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Recently Deleted Modal -->
	{#if showDeletedItems}
		<div class="deleted-overlay" in:fade={{ duration: 200 }} onclick={() => showDeletedItems = false}>
			<div class="deleted-modal" in:scale={{ duration: 300 }} onclick={(e) => e.stopPropagation()}>
				<h3>Recently Deleted</h3>
				
				{#if deletedItems.length === 0}
					<div class="empty-deleted">
						<p>No recently deleted items</p>
					</div>
				{:else}
					<div class="deleted-list">
						{#each deletedItems as item (item.id)}
							<div class="deleted-item" in:fly={{ x: -20, duration: 300 }}>
								<div class="deleted-info">
									<h4>{item.title}</h4>
									<p>{item.content.substring(0, 100)}...</p>
									<span class="deleted-date">
										Deleted {new Date(item.deletedAt).toLocaleDateString()}
									</span>
								</div>
								<div class="deleted-actions">
									<button 
										class="btn restore"
										onclick={() => restoreItem(item.id)}
										title="Restore"
									>
										{@html getIcon('restore', 16)}
									</button>
									<button 
										class="btn delete-permanent"
										onclick={() => permanentlyDelete(item.id)}
										title="Delete Permanently"
									>
										{@html getIcon('trash', 16)}
									</button>
								</div>
							</div>
						{/each}
					</div>
				{/if}
				
				<div class="modal-actions">
					<button onclick={() => showDeletedItems = false} class="btn primary">Close</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Profile Edit Modal -->
	{#if showProfileEdit}
		<div class="profile-overlay" in:fade={{ duration: 200 }} onclick={() => showProfileEdit = false}>
			<div class="profile-modal" in:scale={{ duration: 300 }} onclick={(e) => e.stopPropagation()}>
				<h3>Edit Profile</h3>
				
				<div class="avatar-selection">
					<p>Choose your avatar:</p>
					<div class="avatar-grid">
						{#each avatarOptions as avatar}
							<button
								class="avatar-option"
								class:selected={userProfile.avatar === avatar.id}
								onclick={() => userProfile.avatar = avatar.id}
							>
								{@html getIcon(avatar.icon, 24)}
							</button>
						{/each}
					</div>
				</div>
				
				<div class="form-group">
					<label for="profile-name">Name:</label>
					<input
						id="profile-name"
						type="text"
						bind:value={userProfile.name}
						class="form-input"
					/>
				</div>
				
				<div class="form-actions">
					<button onclick={() => showProfileEdit = false} class="btn secondary">Cancel</button>
					<button onclick={updateProfile} class="btn primary">Save Changes</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Main Content -->
	<main class="main-content">
		<!-- Tasks Section -->
		{#if filteredTasks.length > 0}
			<section class="tasks-section">
				<h3 class="section-title">
					{@html getIcon('check', 20)}
					Tasks ({filteredTasks.filter(t => !t.isCompleted).length} remaining)
				</h3>
				<div class="tasks-grid">
					{#each filteredTasks as task (task.id)}
						<div 
							class="task-card"
							class:completed={task.isCompleted}
							class:high-priority={task.priority === 'high'}
							in:fly={{ y: 20, duration: 300 }}
							animate:flip={{ duration: 300 }}
						>
							<div class="task-header">
								<button 
									class="task-checkbox"
									onclick={() => toggleTask(task.id)}
								>
									{#if task.isCompleted}
										{@html getIcon('check', 18)}
									{/if}
								</button>
								<h4>{task.title}</h4>
								<button 
									class="delete-btn"
									onclick={() => deleteItem(task.id, 'task')}
								>
									{@html getIcon('trash', 16)}
								</button>
							</div>
							<p class="task-content">{task.content}</p>
							<div class="task-footer">
								<span class="category-tag" style="--category-color: {categories.find(c => c.id === task.category)?.color}">
									{categories.find(c => c.id === task.category)?.name}
								</span>
								<span class="priority-tag priority-{task.priority}">{task.priority}</span>
							</div>
						</div>
					{/each}
				</div>
			</section>
		{/if}

		<!-- Notes Section -->
		<section class="notes-section">
			<h3 class="section-title">
				{@html getIcon('brain', 20)}
				Notes ({filteredNotes.length})
			</h3>
			<div class="notes-grid">
				{#each filteredNotes as note (note.id)}
					<div 
						class="note-card"
						in:fly={{ y: 20, duration: 300 }}
						out:fly={{ y: -20, duration: 200 }}
						animate:flip={{ duration: 300 }}
					>
						<div class="note-header">
							<h4>{note.title}</h4>
							<button 
								class="delete-btn"
								onclick={() => deleteItem(note.id, 'note')}
							>
								{@html getIcon('trash', 16)}
							</button>
						</div>
						<p class="note-content">{note.content}</p>
						<div class="note-footer">
							<span class="category-tag" style="--category-color: {categories.find(c => c.id === note.category)?.color}">
								{@html getIcon(categories.find(c => c.id === note.category)?.icon || 'brain', 14)}
								{categories.find(c => c.id === note.category)?.name}
							</span>
							<span class="note-date">
								{new Date(note.createdAt).toLocaleDateString()}
							</span>
						</div>
					</div>
				{/each}
			</div>
		</section>

		{#if filteredNotes.length === 0 && filteredTasks.length === 0}
			<div class="empty-state">
				<div class="empty-icon">{@html getIcon('brain', 64)}</div>
				<h3>Your mind is clear</h3>
				<p>Add your first note or task to get started</p>
				<button class="btn primary" onclick={() => showAddForm = true}>
					{@html getIcon('plus', 20)}
					Create Your First Note
				</button>
			</div>
		{/if}
	</main>
</div>

<style>
	.notes-app {
		min-height: 100vh;
		max-width: 1400px;
		margin: 0 auto;
		padding: 1rem;
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
	}

	/* Header Styles */
	.app-header {
		background: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(20px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 20px;
		padding: 1.5rem;
		margin-bottom: 2rem;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
	}

	:global(body.light-mode) .app-header {
		background: rgba(255, 255, 255, 0.9);
		border-color: rgba(0, 0, 0, 0.1);
	}

	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		gap: 1rem;
	}

	.user-profile {
		display: flex;
		align-items: center;
		gap: 1rem;
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 12px;
		transition: all 0.3s ease;
	}

	.user-profile:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.avatar {
		width: 48px;
		height: 48px;
		background: linear-gradient(135deg, #667eea, #764ba2);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
	}

	.user-info h2 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
	}

	.stats {
		display: flex;
		gap: 1rem;
		font-size: 0.875rem;
		opacity: 0.8;
		margin-top: 0.25rem;
	}

	.streak {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		color: #f59e0b;
	}

	.header-controls {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.search-container {
		position: relative;
		display: flex;
		align-items: center;
	}

	.search-icon {
		position: absolute;
		left: 1rem;
		opacity: 0.6;
		pointer-events: none;
	}

	.search-input {
		padding: 0.75rem 1rem 0.75rem 3rem;
		border: 2px solid rgba(255, 255, 255, 0.1);
		border-radius: 25px;
		background: rgba(255, 255, 255, 0.05);
		color: inherit;
		font-size: 0.875rem;
		min-width: 250px;
		transition: all 0.3s ease;
	}

	.search-input:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
		background: rgba(102, 126, 234, 0.05);
	}

	.deleted-btn {
		position: relative;
	}

	.deleted-count {
		position: absolute;
		top: -8px;
		right: -8px;
		background: #ef4444;
		color: white;
		border-radius: 50%;
		width: 20px;
		height: 20px;
		font-size: 0.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
	}

	/* Category Filter */
	.category-filter {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.category-pill {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		border: 2px solid rgba(255, 255, 255, 0.1);
		border-radius: 20px;
		background: transparent;
		color: inherit;
		cursor: pointer;
		transition: all 0.3s ease;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.category-pill:hover {
		border-color: var(--category-color);
		background: rgba(102, 126, 234, 0.1);
	}

	.category-pill.active {
		background: var(--category-color);
		color: white;
		border-color: var(--category-color);
	}

	/* Button Styles */
	.btn, .add-btn, .deleted-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 12px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		font-size: 0.875rem;
	}

	.btn.primary, .add-btn.primary {
		background: linear-gradient(135deg, #667eea, #764ba2);
		color: white;
	}

	.btn.primary:hover, .add-btn.primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
	}

	.btn.secondary, .deleted-btn.secondary {
		background: rgba(255, 255, 255, 0.1);
		color: inherit;
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.btn.restore {
		background: rgba(16, 185, 129, 0.2);
		color: #10b981;
		padding: 0.5rem;
	}

	.btn.delete-permanent {
		background: rgba(239, 68, 68, 0.2);
		color: #ef4444;
		padding: 0.5rem;
	}

	/* Modal Styles */
	.add-form-overlay, .profile-overlay, .deleted-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(8px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.add-form, .profile-modal, .deleted-modal {
		background: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(30px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 20px;
		padding: 2rem;
		max-width: 500px;
		width: 100%;
		max-height: 80vh;
		overflow-y: auto;
	}

	:global(body.light-mode) .add-form,
	:global(body.light-mode) .profile-modal,
	:global(body.light-mode) .deleted-modal {
		background: rgba(255, 255, 255, 0.95);
		border-color: rgba(0, 0, 0, 0.1);
	}

	.deleted-modal {
		max-width: 600px;
	}

	.form-tabs {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
	}

	.tab-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border: 2px solid rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		background: transparent;
		color: inherit;
		cursor: pointer;
		transition: all 0.3s ease;
		flex: 1;
		justify-content: center;
	}

	.tab-btn.active {
		background: #667eea;
		color: white;
		border-color: #667eea;
	}

	.form-input, .form-textarea, .form-select {
		width: 100%;
		padding: 1rem;
		margin-bottom: 1rem;
		border: 2px solid rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		background: rgba(255, 255, 255, 0.05);
		color: inherit;
		font-family: inherit;
		font-size: 1rem;
		transition: all 0.3s ease;
	}

	/* Blacker text for form select dropdowns */
	.form-select.black-text {
		color: #1e293b !important;
		font-weight: 600;
	}

	.form-select.black-text option {
		color: #1e293b !important;
		background: white;
		font-weight: 600;
	}

	:global(body.light-mode) .form-select.black-text {
		color: #0f172a !important;
	}

	.form-textarea {
		min-height: 120px;
		resize: vertical;
	}

	.form-input:focus, .form-textarea:focus, .form-select:focus {
		outline: none;
		border-color: #667eea;
		background: rgba(102, 126, 234, 0.05);
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.form-actions, .modal-actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		margin-top: 1.5rem;
	}

	/* Recently deleted styles */
	.deleted-list {
		max-height: 400px;
		overflow-y: auto;
		margin-bottom: 1rem;
	}

	.deleted-item {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		padding: 1rem;
		margin-bottom: 0.75rem;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.deleted-info h4 {
		margin: 0 0 0.5rem 0;
		font-size: 1rem;
	}

	.deleted-info p {
		margin: 0 0 0.5rem 0;
		font-size: 0.875rem;
		opacity: 0.8;
	}

	.deleted-date {
		font-size: 0.75rem;
		opacity: 0.6;
	}

	.deleted-actions {
		display: flex;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.empty-deleted {
		text-align: center;
		padding: 2rem;
		opacity: 0.6;
	}

	/* Avatar Selection */
	.avatar-selection p {
		margin-bottom: 1rem;
		font-weight: 500;
	}

	.avatar-grid {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}

	.avatar-option {
		width: 50px;
		height: 50px;
		border: 2px solid rgba(255, 255, 255, 0.1);
		border-radius: 50%;
		background: transparent;
		color: inherit;
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.avatar-option:hover {
		border-color: #667eea;
		background: rgba(102, 126, 234, 0.1);
	}

	.avatar-option.selected {
		border-color: #667eea;
		background: #667eea;
		color: white;
	}

	/* Main Content */
	.main-content {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.section-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: 1rem;
		opacity: 0.9;
	}

	/* Task and Note Styles */
	.tasks-grid, .notes-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 1.5rem;
	}

	.task-card, .note-card {
		background: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(20px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 16px;
		padding: 1.5rem;
		transition: all 0.3s ease;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
	}

	:global(body.light-mode) .task-card,
	:global(body.light-mode) .note-card {
		background: rgba(255, 255, 255, 0.8);
		border-color: rgba(0, 0, 0, 0.1);
	}

	.task-card:hover, .note-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
	}

	.task-card.completed {
		opacity: 0.7;
	}

	.task-card.high-priority {
		border-left: 4px solid #ef4444;
	}

	.task-header, .note-header {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.task-checkbox {
		width: 24px;
		height: 24px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-radius: 6px;
		background: transparent;
		color: #10b981;
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.task-checkbox:hover {
		border-color: #10b981;
		background: rgba(16, 185, 129, 0.1);
	}

	.task-header h4, .note-header h4 {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
		flex: 1;
		line-height: 1.4;
	}

	.task-card.completed h4 {
		text-decoration: line-through;
		opacity: 0.6;
	}

	.delete-btn {
		background: transparent;
		border: none;
		color: #ef4444;
		cursor: pointer;
		padding: 0.25rem;
		border-radius: 6px;
		transition: all 0.3s ease;
		opacity: 0.6;
	}

	.delete-btn:hover {
		background: rgba(239, 68, 68, 0.1);
		opacity: 1;
	}

	.task-content, .note-content {
		margin: 0 0 1rem 0;
		line-height: 1.6;
		opacity: 0.9;
	}

	.task-footer, .note-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.category-tag {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		background: var(--category-color);
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.priority-tag {
		padding: 0.25rem 0.5rem;
		border-radius: 8px;
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	.priority-high {
		background: rgba(239, 68, 68, 0.2);
		color: #ef4444;
	}

	.priority-medium {
		background: rgba(245, 158, 11, 0.2);
		color: #f59e0b;
	}

	.priority-low {
		background: rgba(16, 185, 129, 0.2);
		color: #10b981;
	}

	.note-date {
		font-size: 0.75rem;
		opacity: 0.6;
	}

	/* Empty State */
	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		opacity: 0.8;
	}

	.empty-icon {
		margin: 0 auto 1rem;
		opacity: 0.4;
	}

	.empty-state h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.5rem;
		font-weight: 600;
	}

	.empty-state p {
		margin: 0 0 2rem 0;
		opacity: 0.8;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.notes-app {
			padding: 0.5rem;
		}

		.header-content {
			flex-direction: column;
			align-items: stretch;
			gap: 1rem;
		}

		.user-profile {
			justify-content: center;
		}

		.header-controls {
			flex-direction: column;
			gap: 1rem;
		}

		.search-input {
			min-width: auto;
			width: 100%;
		}

		.category-filter {
			justify-content: center;
		}

		.tasks-grid, .notes-grid {
			grid-template-columns: 1fr;
		}

		.form-row {
			grid-template-columns: 1fr;
		}

		.avatar-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	/* Color adjustments for light mode */
	:global(body.light-mode) .search-input,
	:global(body.light-mode) .form-input,
	:global(body.light-mode) .form-textarea,
	:global(body.light-mode) .form-select {
		background: rgba(255, 255, 255, 0.8);
		border-color: rgba(0, 0, 0, 0.1);
	}

	:global(body.light-mode) .search-input::placeholder,
	:global(body.light-mode) .form-input::placeholder,
	:global(body.light-mode) .form-textarea::placeholder {
		color: rgba(0, 0, 0, 0.5);
	}
</style>
