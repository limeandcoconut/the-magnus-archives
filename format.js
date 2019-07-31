
const specialInfoTypes = {
	statement: 'number',
	episode: 'number',
	date: 'date',
}

const s = '  '
const border = '--------------------'

const concatList = (list, level = 0) => {
	const indent = s.repeat(level + 1)
	const data = specialInfoTypes[list[0].type] || 'notes'
	return list.reduce((list, node) => `${list}${indent}${node[data]}\n`, '').slice(0, -1)
}

const enumerate = (list) => {
	if (list.length === 0) {
		return 'No listing\n'
	}
	if (!Array.isArray(list)) {
		list = [list]
	}
	return `${list[0].type}s:\n${concatList(list)}\n`

}

const profile = (node) => {
	// const firstName = node.name.shift().notes
	const name = node.names.slice(1)

	return `
${border}
${s}${node.names[0].notes}

${s}${
	name.length ?
		`other name:\n${concatList(name, 1)}` :
		''}
${border}`

}

module.exports = {
	enumerate,
	profile,
}
