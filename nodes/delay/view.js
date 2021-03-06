var h = require('lib/h')
var when = require('@mmckegg/mutant/when')
var Header = require('lib/widgets/header')
var ModRange = require('lib/params/mod-range')
var ToggleButton = require('lib/params/toggle-button')
var Select = require('lib/params/select')
var QueryParam = require('lib/query-param')

var filterChoices = [
  ['Lowpass', 'lowpass'],
  ['Highpass', 'highpass']
]

module.exports = function renderDelay (node) {
  return h('ProcessorNode -delay', [

    Header(node, h('span', 'Delay')),

    h('ParamList', [

      ToggleButton(node.sync, {
        title: 'BPM Sync'
      }),

      ToggleButton(QueryParam(node, 'node'), {
        title: 'Ping Pong',
        onValue: 'processor/ping-pong-delay',
        offValue: 'processor/delay'
      }),

      when(node.sync,
        ModRange(node.time, {
          title: 'time',
          defaultValue: 0.25,
          format: 'beat',
          flex: true
        }),
        ModRange(node.time, {
          title: 'time',
          defaultValue: 0.25,
          format: 'ms',
          flex: true
        })
      ),

      ModRange(node.feedback, {
        title: 'feedback',
        defaultValue: 0.6,
        format: 'dB',
        flex: true
      }),

      Select(node.filterType, {
        defaultValue: 'lowpass',
        options: filterChoices
      }),

      ModRange(node.cutoff, {
        title: 'cutoff',
        defaultValue: 20000,
        format: 'arfo',
        flex: true
      }),

      ModRange(node.wet, {
        title: 'wet',
        defaultValue: 1,
        format: 'dB',
        flex: true
      }),

      ModRange(node.dry, {
        title: 'dry',
        defaultValue: 1,
        format: 'dB',
        flex: true
      })

    ])

  ])
}
