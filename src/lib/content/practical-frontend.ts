import type { Slide } from '$lib/types';

export const practicalFrontend: Record<string, Slide[]> = {
    intro: [
        {
            title: 'Welcome to Practical Frontend!'
        },
        {
            title: 'What is this playlist about?'
        },
        {
            title: 'Prerequisites',
            content: 'Some _basic_ knowledge of **JavaScript** and **React**.'
        },
        {
            title: 'How to follow along?'
        },
        {
            title: "Let's get started!"
        }
    ],
    modals: [
        {
            title: 'Modals'
        },
        {
            title: 'Modals are used to',
            ul: ['Show additional information', 'Ask for user input', 'Confirm an action']
        },
        {
            title: 'How to create a modal?',
            ul: [
                "Javascript's `prompt()` or `alert()` functions",
                'HTML `<dialog>` element',
                'Custom modal component'
            ]
        }
    ]
};
