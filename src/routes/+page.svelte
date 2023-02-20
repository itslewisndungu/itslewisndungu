<script>
	import GithubIcon from '../components/GithubIcon.svelte';
</script>

<svelte:head>
	<title>Lewis Ndung'u</title>

	<meta
		name="description"
		content="I am a software developer from Kenya, and i do mostly web development with Typescript, React, Svelte, Python and Go"
	/>
</svelte:head>

<main class="flex flex-col gap-8 p-5">
	<h1 class="text-4xl md:text-5xl text-gray-900">Hello there! I'm Lewis Ndung'u</h1>

	<div class="flex flex-col gap-1 m-t-35 m-b-40">
		<p class="text-lg text-slate-900">A software developer from Kenya.</p>

		<p class="text-lg text-slate-900">
			I do mostly web development (Typescript, React, Svelte, Python, Go).
		</p>

		<p class="text-lg text-slate-900 ">
			I'm currently a computer science major at
			<a class="link" href="https://www.ku.ac.ke/" target="_blank" rel="noreferrer noopener"
				>Kenyatta University</a
			>
		</p>
	</div>

	<a
		href="https://github.com/itslewisndungu"
		target="_blank"
		rel="noreferrer noopener"
		class="flex gap-2"
	>
		<GithubIcon />
		<strong>GitHub</strong>
	</a>
</main>
