<script lang="ts">
	import { createEventDispatcher, tick } from 'svelte';
	import { LL } from '../i18n/i18n-svelte';
	import type { Project } from './projects';
	import { derivedProjectName, isProjectEmpty } from './projects';

	export let projects: Project[];
	export let activeId: string;

	const dispatch = createEventDispatcher<{
		switch: { id: string };
		add: undefined;
		close: { id: string };
		rename: { id: string; name: string };
	}>();

	let renamingId: string | null = null;
	let renameValue = '';
	let renameInput: HTMLInputElement;

	async function startRename(project: Project) {
		renamingId = project.id;
		renameValue = project.name;
		await tick();
		renameInput?.focus();
		renameInput?.select();
	}

	function commitRename() {
		if (renamingId === null) return;
		dispatch('rename', { id: renamingId, name: renameValue.trim() });
		renamingId = null;
		renameValue = '';
	}

	function cancelRename() {
		renamingId = null;
		renameValue = '';
	}

	function requestClose(project: Project) {
		if (!isProjectEmpty(project)) {
			if (!confirm($LL.confirm.closeTab({ name: derivedProjectName(project, $LL.projects.untitled()) }))) return;
		}
		dispatch('close', { id: project.id });
	}
</script>

<div class="tabs" role="tablist">
	{#each projects as project (project.id)}
		{@const displayName = derivedProjectName(project, $LL.projects.untitled())}
		<div class="tab" class:active={project.id === activeId} role="tab" aria-selected={project.id === activeId}>
			{#if renamingId === project.id}
				<input
					class="rename-input"
					bind:this={renameInput}
					bind:value={renameValue}
					on:keydown={(e) => {
						if (e.key === 'Enter') {
							e.preventDefault();
							commitRename();
						} else if (e.key === 'Escape') {
							e.preventDefault();
							cancelRename();
						}
					}}
					on:blur={commitRename}
				/>
			{:else}
				<button
					class="tab-label"
					type="button"
					title={displayName}
					on:click={() => dispatch('switch', { id: project.id })}
					on:dblclick={() => startRename(project)}
				>
					<span class="name">{displayName}</span>
				</button>
				<button
					class="close"
					type="button"
					title={$LL.projects.closeTab()}
					aria-label={$LL.projects.closeTab()}
					on:click|stopPropagation={() => requestClose(project)}
				>
					<iconify-icon icon="material-symbols:close-rounded" inline="true" />
				</button>
			{/if}
		</div>
	{/each}
	<button class="add" type="button" title={$LL.projects.newTab()} aria-label={$LL.projects.newTab()} on:click={() => dispatch('add')}>
		<iconify-icon icon="material-symbols:add-rounded" inline="true" />
	</button>
</div>

<style>
	.tabs {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3em;
		align-items: stretch;
		padding: 0.4em 0.6em 0;
		border-bottom: 1px solid rgb(46 91 255 / 0.12);
	}

	.tab {
		display: inline-flex;
		align-items: center;
		gap: 0.25em;
		padding: 0.35em 0.4em 0.35em 0.75em;
		border-radius: 0.4em 0.4em 0 0;
		background: rgb(255 255 255 / 0.55);
		border: 1px solid transparent;
		border-bottom: none;
		max-width: 16em;
		min-width: 5em;
		transition: background-color 160ms ease, border-color 160ms ease, transform 160ms ease;
	}

	.tab:hover {
		background: rgb(255 255 255 / 0.85);
	}

	.tab.active {
		background: white;
		border-color: rgb(46 91 255 / 0.2);
		box-shadow: 0 -2px 6px rgb(31 44 84 / 0.06);
	}

	.tab-label {
		appearance: none;
		background: none;
		border: none;
		font: inherit;
		font-weight: 600;
		color: rgb(60 67 96);
		cursor: pointer;
		padding: 0;
		flex: 1 1 auto;
		min-width: 0;
		text-align: left;
	}

	.tab.active .tab-label {
		color: rgb(33 56 199);
	}

	.tab-label .name {
		display: block;
		max-width: 14em;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.rename-input {
		font: inherit;
		font-weight: 600;
		border: 1px solid rgb(46 91 255 / 0.35);
		border-radius: 0.25em;
		padding: 0.1em 0.35em;
		width: 12em;
		max-width: 100%;
		outline: none;
		background: white;
	}

	.close,
	.add {
		appearance: none;
		background: none;
		border: 1px solid transparent;
		border-radius: 999px;
		width: 1.5em;
		height: 1.5em;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		color: rgb(74 82 112);
		font-size: 1em;
	}

	.close:hover {
		background: rgb(224 0 32 / 0.1);
		color: rgb(190 0 30);
	}

	.add {
		align-self: center;
		margin-bottom: 0.35em;
		border: 1px dashed rgb(46 91 255 / 0.35);
		color: rgb(33 56 199);
	}

	.add:hover {
		background: rgb(46 91 255 / 0.08);
	}
</style>
