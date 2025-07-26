<script>
    import Sveal from '$lib/sveal.svelte';
</script>

<Sveal
    slides={[
        {
            title: 'Hello World!',
            code: `const name = 'Fox'\nconsole.log(\`hello \${name}!\`)`,
            lang: 'typescript'
        },
        {
            title: 'Sveal is a presentation tool',
            content: 'It lets you create slideshows on the fly with an array of slides.'
        },
        {
            title: 'With code highlighting!',
            code: `process.exit(0)`,
            lang: 'javascript'
        }
    ]}
/>
