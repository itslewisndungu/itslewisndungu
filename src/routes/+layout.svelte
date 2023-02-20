<script>
	import '../app.scss';
	import '../app.postcss';
	import { dev } from '$app/environment';
	import { inject } from '@vercel/analytics';

	inject({ mode: dev ? 'development' : 'production' });

	export const csr = false;
</script>

<slot />
