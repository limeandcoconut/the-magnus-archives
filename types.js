'use strict'
const {profile, enumerate} = require('./format')
const episodeFixtures = require('./episodes')

let CURRENT_EPISODE = 3
const statementStore = {}
const episodeStore = {}
const dateStore = {}
const personStore = {}
const locationStore = {}
const itemStore = {}
const themeStore = {}
const nameStore = {}

const nodeStores = {
	statement: statementStore,
	episode: episodeStore,
	date: dateStore,
	person: personStore,
	location: locationStore,
	item: itemStore,
	theme: themeStore,
	name: nameStore,
}

class Node {
	constructor({links, notes = '', type, id, buildCache = null}) {
		this.id = id
		this.notes = notes
		this.type = type
		// Not a default param so it can be checked explicitly
		this.links = links || this.newCache()

		// If buildCache or if there are links and buildCache !== false
		if (buildCache || Boolean(links) !== buildCache) {
			this.buildCache()
		} else {
			this.cache = this.newCache()
		}
	}

	newCache() {
		return new Map(Node.linkTypes.map((type) => [type, new Map()]))
	}

	clearCache() {
		this.cache = this.newCache()
	}

	// links: Map {
	// 	names: => Map{ // Singular types
	// 		1 => [],
	// 		3 => [],
	// 	},
	// 	person => Map { // This episodeNumber => [] grouping is a cluster
	// 		2 => [],
	// 		3 => [],
	// 	},
	// 	// ...
	// }

	link(node, episodeNumber) {
		const cluster = this.links.get(node.type)

		const list = this.getstablishEpisode(cluster, episodeNumber)
		list.push(node)

		cluster.set(episodeNumber, list)

		return this
	}

	getstablishEpisode(cluster, episodeNumber) {
		let list = cluster.get(episodeNumber)
		if (!list) {
			list = []
			cluster.set(episodeNumber, list)
		}
		return list
	}

	interlink(node, episodeNumber) {
		this.link(node, episodeNumber)
		node.link(this, episodeNumber)
		return this
	}

	buildCache() {
		this.cache = new Map()
		for (let [type, cluster] of this.links) {
			const newCluster = new Map()
			this.cache.set(type, newCluster)
			for (const [episodeNumber, list] of cluster) {
				if (episodeNumber > CURRENT_EPISODE) {
					break
				}
				newCluster.set(episodeNumber, list)
			}
		}

		// this.cache = new Map(this.links.entries.map(([type, cluster]) =>
		// 	[
		// 		type,
		// 		cluster.entries.filter(([episodeNumber]) => episodeNumber <= CURRENT_EPISODE),
		// 	]
		// ))
	}
	// buildCache() {
	// 	this.cache = new Map([...this.links.entries()].map(([type, cluster]) =>
	// 		[
	// 			type,
	// 			[...cluster.entries()].filter(([episodeNumber]) => episodeNumber <= CURRENT_EPISODE),
	// 		]
	// 	))
	// }

	// sanitize() {
	// 	this.cache = Object.freeze(new Map(this.links.entries.map(([type, cluster]) =>
	// 		[
	// 			type,
	// 			Object.freeze(cluster.entries.reduce((cluster, [episodeNumber, list]) => {
	// 				if (episodeNumber <= CURRENT_EPISODE) {
	// 					cluster.set(episodeNumber, Object.freeze(list))
	// 				}
	// 			}, new Map())),
	// 		]
	// 	)))
	// 	this.sanitized = true
	// }
}

Node.linkTypes = ['statement', 'episode', 'date', 'person', 'location', 'item', 'theme', 'name']

const getCacheGetter = (type) => function() {
	return this.cache.get(type)
}

for (let type of Node.linkTypes) {
	const plural = type + 's'
	Object.defineProperty(Node.prototype, plural, {
		get: getCacheGetter(type),
	})
}

const typeMixin = (Base, type) => class extends Base {
	constructor() {
		arguments[0].type = type
		super(...arguments)
	}
}

class Statement extends typeMixin(Node, 'statement') {
	constructor({number}) {
		super(...arguments)
		this.number = number
		// transcript: String,
	}
}
class Episode extends typeMixin(Node, 'episode') {
	constructor({number}) {
		super(...arguments)
		this.number = number
	}
}
class ArchiveDate extends typeMixin(Node, 'date') {
	constructor({date}) {
		super(...arguments)
		this.date = date
	}
}
class Person extends typeMixin(Node, 'person') {
	getPrimaryName() {
		return this.links.get(episodeStore).get('name')[0]
	}
}
class Location extends typeMixin(Node, 'location') {}
class Item extends typeMixin(Node, 'item') {}
class Theme extends typeMixin(Node, 'theme') {}
class Name extends typeMixin(Node, 'name') {}

const nodeClasses = {
	statement: Statement,
	episode: Episode,
	date: ArchiveDate,
	person: Person,
	location: Location,
	item: Item,
	theme: Theme,
	name: Name,
}

// const createPerson = ({person, name, episodeNumber}) => {
// 	return new Person({notes: person}).interlink(new Name({notes: name}), episodeNumber)
// }

const createEpisode = ({episodeNumber, newNodes = {}, nodes: interlinkNodes = {}}) => {
	// Create and store episode
	const episode = new Episode({id: episodeNumber, number: episodeNumber})
	episodeStore[episodeNumber] = episode
	interlinkNodes = new Map([[episode, interlinkNodes]])
	// Create new nodes of each type
	for (const [type, list] of Object.entries(newNodes)) {
		const store = nodeStores[type]
		const NodeClass = nodeClasses[type]
		// Create new nodes of this type
		for (let nodeData of list) {
			// Create new node
			const links = nodeData.links
			nodeData.links = null
			const newNode = new NodeClass(nodeData)
			// Add to interlinks to interlink List
			if (links) {
				interlinkNodes.set(newNode, links)
			}
			// Store in list
			store[nodeData.id] = newNode

			// Interlink with episode
			episode.interlink(newNode, episodeNumber)
		}
	}

	// Interlink various nodes
	for (const [node, lists] of interlinkNodes) {
		for (const [type, nodeIds] of Object.entries(lists)) {
			const LIST = nodeStores[type]
			nodeIds.forEach((id) => {
				node.interlink(LIST[id], episodeNumber)
			})
		}
	}

}

// const instituteName = 'The Magnus Institute'
// const archivesName = 'Archive Room'

createEpisode(episodeFixtures[1])

const jonName = 'Jonathan Simms'
const jon = personStore[jonName]
// const institute = locationList[instituteName]
// const archives = locationList[archivesName]

// jon.interlink(nameList[jonName], 1)
// jon.interlink(statementList['#0122204'], 1)

// personList['Nathan Watts'].interlink(nameList['Nathan Watts'], 1)
// personList['Nathan Watts'].interlink(statementList['#0122204'], 1)
// personList['Nathan Watts'].interlink(themeList['Angler Fish'], 1)
// personList['Nathan Watts'].interlink(dateList['#0122204'], 1)
// jon.interlink(personList['Nathan Watts'], 1)
// dateList['#0122204'].interlink(statementList['#0122204'], 1)

// institute.interlink(nameList[instituteName], 1)
// institute.interlink(jon, 1)
// institute.interlink(statementList['#0122204'], 1)

// archives.interlink(nameList[archivesName], 1)
// archives.interlink(jon, 1)
// archives.interlink(statementList['#0122204'], 1)
// archives.interlink(institute, 1)

for (let n = 2; n <= 10; n++) {
	createEpisode({
		episodeNumber: n,
		nodes: {
			person: [
				jonName,
			],
		},
		newNodes: {
			// name: [
			// 	{
			// 		id: 'Jon',
			// 		notes: 'Jon',
			// 	},
			// ],
		},
	})
}

// jon.interlink(statementList['#33333333'], 3)
// jon.interlink(nameList.Jon, 3)

// const js2 = new Name({
// 	notes: 'Johnathan Simms 2',
// })
// jon.interlink(js2, 2)

// TODO: Handle double interlinks

// console.log(personList)
// console.log(jon.links.get(1).get('name')[0].notes)
// console.log(jon.getPrimaryName().notes)

console.log()
console.log()
let output = ''

console.log(personStore['Nathan Watts'])
console.log()
console.log()
// console.log()
// console.log()

jon.buildCache()
// console.log()
// console.log()
console.log(jon)
console.log()
console.log()
console.log()
// console.log(jon.links)
console.log(jon.cache)
// // output += enumerate(personStore['Nathan Watts'].statements)
// output += personStore['Nathan Watts'].statements
// // output += '\n'
// // output += enumerate([])
// // output += enumerate(personStore['Nathan Watts'].location)
// // enumerate(personStore['Jonathan Simms'].episode)
// // enumerate(personStore['Jonathan Simms'].person[0].name)
// // console.log(personStore['Nathan Watts'])
// // console.log(jon)
// // console.log('')
// output += '\n'
// // output += enumerate(jon.statements)
// output += jon.statements
// output += '\n'
// // output += enumerate(jon.episodes)
// output += jon.episodes
// output += '\n'
// // console.log()
// // output += profile(jon)

// console.log(output)

/*
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 */

// let jon = new Person({
// 	notes: 'Head archivist of the Magnus Institute 2016-present',
// })
// jon.interlink(new Name({
// 	notes: 'Johnathan Simms',
// }, 1)
// jon.interlink(js2, 2)
// jon.interlink(new Name({
// 	notes: 'Johnathan Simms 2',
// }), 2)

// let date = new ArchiveDate({
// 	date: 'abc',
// 	notes:
//   'notes',
// 	links: new Map(),
// })
// console.log(date)
// console.log(jon)

