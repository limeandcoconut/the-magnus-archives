'use strict'
const {profile, enumerate} = require('./format')
const episodeFixtures = require('./episodes')

let CURRENT_EPISODE = 3
const STATEMENT = {}
const EPISODE = {}
const DATE = {}
const PERSON = {}
const LOCATION = {}
const ITEM = {}
const THEME = {}
const NAME = {}

const ALL_NODES = {
	statement: STATEMENT,
	episode: EPISODE,
	date: DATE,
	person: PERSON,
	location: LOCATION,
	item: ITEM,
	theme: THEME,
	name: NAME,
}

const getCreateMap = (parent, key) => {
	let map = parent.get(key)
	if (!map) {
		map = new Map()
		parent.set(key, map)
	}
	return map
}

const getCreateArray = (parent, key) => {
	let list = parent.get(key)
	if (!list) {
		list = []
		parent.set(key, list)
	}
	return list
}

class Node {
	constructor({links, notes = '', type, id}) {
		this.id = id
		this.notes = notes
		this.type = type
		if (!links) {
			this.links = new Map()
			return
		}
		this.links = links
		this.buildLinkCache()
	}

	link(node, episodeNumber) {
		const cluster = getCreateMap(this.links, episodeNumber)
		const type = getCreateArray(cluster, node.type)
		type.push(node)
		this.buildLinkCache()
		return this
	}

	interlink(node, episodeNumber) {
		this.link(node, episodeNumber)
		node.link(this, episodeNumber)
		this.buildLinkCache()
		return this
	}

	buildLinkCache() {
		const linkTypes = Node.linkTypes
		for (let i = 0; i <= CURRENT_EPISODE; i++) {
			for (let type of linkTypes) {
				let plural = type + 's'
				if (i === 0) {
					this[plural] = []
				}
				let episodeLinks = this.links.get(i)

				if (!episodeLinks) {
					continue
				}
				episodeLinks = episodeLinks.get(type)
				if (!episodeLinks) {
					continue
				}
				this[plural] = this[plural].concat(episodeLinks)
				if (i === CURRENT_EPISODE) {
					Object.freeze(this[plural])
				}
			}
		}

	}
}

Node.linkTypes = ['statement', 'episode', 'date', 'person', 'location', 'item', 'theme', 'name']

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
		return this.links.get(EPISODE).get('name')[0]
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

const createPerson = ({person, name, episodeNumber}) => {
	return new Person({notes: person}).interlink(new Name({notes: name}), episodeNumber)
}

const createEpisode = ({episodeNumber, newNodes = {}, nodes: interlinkNodes = {}}) => {
	// Create and store episode
	const episode = new Episode({id: episodeNumber, number: episodeNumber})
	EPISODE[episodeNumber] = episode
	interlinkNodes = new Map([[episode, interlinkNodes]])
	// Create new nodes of each type
	for (const [type, nodesData] of Object.entries(newNodes)) {
		const LIST = ALL_NODES[type]
		const NodeClass = nodeClasses[type]
		// Create new nodes of this type
		for (let nodeData of nodesData) {
			// Create new node
			const links = nodeData.links
			nodeData.links = null
			const newNode = new NodeClass(nodeData)
			// Add to interlinks to interlink List
			if (links) {
				interlinkNodes.set(newNode, links)
			}
			// Store in list
			LIST[nodeData.id] = newNode
			// Interlink with episode
			episode.interlink(newNode, episodeNumber)
		}
	}

	// Interlink various nodes
	for (const [node, lists] of interlinkNodes) {
		for (const [type, nodeIds] of Object.entries(lists)) {
			const LIST = ALL_NODES[type]
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
const jon = PERSON[jonName]
// const institute = LOCATION[instituteName]
// const archives = LOCATION[archivesName]

// jon.interlink(NAME[jonName], 1)
// jon.interlink(STATEMENT['#0122204'], 1)

// PERSON['Nathan Watts'].interlink(NAME['Nathan Watts'], 1)
// PERSON['Nathan Watts'].interlink(STATEMENT['#0122204'], 1)
// PERSON['Nathan Watts'].interlink(THEME['Angler Fish'], 1)
// PERSON['Nathan Watts'].interlink(DATE['#0122204'], 1)
// jon.interlink(PERSON['Nathan Watts'], 1)
// DATE['#0122204'].interlink(STATEMENT['#0122204'], 1)

// institute.interlink(NAME[instituteName], 1)
// institute.interlink(jon, 1)
// institute.interlink(STATEMENT['#0122204'], 1)

// archives.interlink(NAME[archivesName], 1)
// archives.interlink(jon, 1)
// archives.interlink(STATEMENT['#0122204'], 1)
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

// jon.interlink(STATEMENT['#33333333'], 3)
// jon.interlink(NAME.Jon, 3)

// const js2 = new Name({
// 	notes: 'Johnathan Simms 2',
// })
// jon.interlink(js2, 2)

// TODO: Handle double interlinks

// console.log(PERSON)
// console.log(jon.links.get(1).get('name')[0].notes)
// console.log(jon.getPrimaryName().notes)

console.log()
console.log()
let output = ''

console.log(PERSON['Nathan Watts'])
output += enumerate(PERSON['Nathan Watts'].statements[0].dates)
// output += '\n'
// output += enumerate([])
// output += enumerate(PERSON['Nathan Watts'].location)
// enumerate(PERSON['Jonathan Simms'].episode)
// enumerate(PERSON['Jonathan Simms'].person[0].name)
// console.log(PERSON['Nathan Watts'])
// console.log(jon)
// console.log('')
output += '\n'
output += enumerate(jon.statements)
output += '\n'
output += enumerate(jon.episodes)
output += '\n'
// console.log()
output += profile(jon)

console.log(output)

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

