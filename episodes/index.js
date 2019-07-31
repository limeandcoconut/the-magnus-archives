const episode1 = {
	episodeNumber: 1,
	newNodes: {
		person: [
			{
				id: 'Jonathan Simms',
				notes: 'Head archivist of the Magnus Institute 2016 - Present',
				links: {
					name: [
						'Jonathan Simms',
						'Jon',
					],
					location: [
						'The Magnus Institute',
						'Archive Room',
					],
				},
			}, {
				id: 'Nathan Watts',
				notes: 'Gave statement #0122204 regarding an encounter on Old Fishmarket Close, Edinburgh, 22nd April 2012.',
				links: {
					name: ['Nathan Watts'],
					statement: ['#0122204'],
					date: ['#0122204'],
					theme: ['Angler Fish'],
				},
			},
		],
		name: [
			{
				id: 'Jonathan Simms',
				notes: 'Jonathan Simms',
			}, {
				id: 'Jon',
				notes: 'Jon',
			}, {
				id: 'Nathan Watts',
				notes: 'Nathan Watts',
			}, {
				id: 'Archive Room',
				notes: 'Archive Room',
			}, {
				id: 'The Magnus Institute',
				notes: 'The Magnus Institute',
			}, {
				id: 'Angler Fish',
				notes: 'Angler Fish',
			},
		],
		location: [
			{
				id: 'Archive Room',
				notes: 'Archive Room',
				links: {
					name: ['Archive Room'],
					location: ['The Magnus Institute'],
				},
			}, {
				id: 'The Magnus Institute',
				notes: 'The Magnus Institute',
				links: {
					name: ['The Magnus Institute'],
				},
			},
		],
		statement: [
			{
				id: '#0122204',
				number: '#0122204',
				links: {
					date: ['#0122204'],
				},
			},
		],
		theme: [
			{
				id: 'Angler Fish',
				notes: 'Angler Fish',
				links: {
					statement: ['#0122204'],
				},
			},
		],
		date: [
			{
				id: '#0122204',
				// date: new Date('')
				date: '#0122204',
			},
		],
	},
}

module.exports = [
	'placeholder',
	episode1,
]
