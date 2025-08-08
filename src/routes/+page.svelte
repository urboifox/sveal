<script>
    import Sveal from '$lib/sveal.svelte';
</script>

<Sveal
    slides={[
        {
            title: 'Hello World!'
        },
        {
            title: 'Sveal is a presentation tool',
            content: 'It lets you create slideshows on the fly with an array of slides.',
            lang: 'typescript'
        },
        {
            title: 'With code highlighting!',
            code: `const name = 'Fox'\nconsole.log(\`hello \${name}!\`)`,
            lang: 'typescript'
        }
    ]}
/>
