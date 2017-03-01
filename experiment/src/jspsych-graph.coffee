###
jspsych-plane.coffee
Fred Callaway

An MDP mdp in which the participant plans flights to
maximize profit.

###

# coffeelint: disable=max_line_length
mdp = undefined


jsPsych.plugins['graph'] = do ->

  PRINT = (args...) -> console.log args...
  NULL = (args...) -> null
  LOG_INFO = PRINT
  LOG_DEBUG = PRINT

  # a scaling parameter, determines size of drawn objects
  SIZE = undefined
  TRIAL_INDEX = 1

  fabric.Object::originX = fabric.Object::originY = 'center'
  fabric.Object::selectable = false
  fabric.Object::hoverCursor = 'plain'

  # =========================== #
  # ========= Helpers ========= #
  # =========================== #

  angle = (x1, y1, x2, y2) ->
    x = x2 - x1
    y = y2 - y1
    if x == 0
      ang = if y == 0 then 0 else if y > 0 then Math.PI / 2 else Math.PI * 3 / 2
    else if y == 0
      ang = if x > 0 then 0 else Math.PI
    else
      ang = if x < 0
        Math.atan(y / x) + Math.PI
      else if y < 0
        Math.atan(y / x) + 2 * Math.PI
      else Math.atan(y / x)
    return ang + Math.PI / 2

  polarMove = (x, y, ang, dist) ->
    x += dist * Math.sin ang
    y -= dist * Math.cos ang
    return [x, y]

  dist = (o1, o2) ->
    ((o1.left - o2.left) ** 2 + (o1.top - o2.top)**2) ** 0.5

  redGreen = (val) ->
    if val > 0
      '#080'
    else if val < 0
      '#b00'
    else
      '#888'

  round = (x) ->
    (Math.round (x * 100)) / 100

  checkObj = (obj, keys) ->
    if not keys?
      keys = Object.keys(obj)
    for k in keys
      if obj[k] is undefined
        console.log 'Bad Object: ', obj
        throw new Error "#{k} is undefined"
    obj

  KEYS = _.mapObject
    up: 'uparrow'
    down: 'downarrow',
    right: 'rightarrow',
    left: 'leftarrow',
    jsPsych.pluginAPI.convertKeyCharacterToKeyCode
  
  KEY_DESCRIPTION = """
  Navigate with the arrow keys.
  """


# ============================ #
# ========= GraphMDP ========= #
# ============================ #
  
  class GraphMDP
    constructor: (config) ->
      {
        @display  # html display element
        @graph  # defines transition and reward functions
        @layout  # defines position of states
        @initial  # initial state of player

        @click=null  # function (s) -> (reward, label)
        @keys=KEYS  # mapping from actions to keycodes
        @trialIndex=TRIAL_INDEX  # number of trial (starts from 1)

        @playerImage='/static/images/plane.png'
        @showRewards=true
        @showStateNames=false
        SIZE=120

        leftMessage='Round: 1/1'
        centerMessage='&nbsp;'
        rightMessage='Score: <span id=graph-score/>'
        lowerMessage=KEY_DESCRIPTION
      } = config

      checkObj this

      @invKeys = _.invert @keys
      @data =
        trialIndex: @trialIndex
        score: 0
        path: []
        rt: []
        actions: []
        actionTimes: []
        clicks: []
        clickTimes: []

      @leftMessage = $('<div>',
        id: 'graph-msg-left'
        class: 'graph-header'
        html: leftMessage).appendTo @display

      @centerMessage = $('<div>',
        id: 'graph-msg-center'
        class: 'graph-header'
        html: centerMessage).appendTo @display

      @rightMessage = $('<div>',
        id: 'graph-msg-right',
        class: 'graph-header'
        html: rightMessage).appendTo @display
      @addScore 0
          
      @canvasElement = $('<canvas>',
        id: 'graph-canvas',
      ).attr(width: 500, height: 500).appendTo @display

      @lowerMessage = $('<div>',
        id: 'graph-msg-bottom'
        html: lowerMessage or '&nbsp'
      ).appendTo @display
      
      mdp = this
      LOG_INFO 'new GraphMDP', this


    # ---------- Responding to user input ---------- #

    # Called when a valid action is initiated via a key press.
    handleKey: (s0, a) =>
      LOG_DEBUG 'handleKey', s0, a
      @data.actions.push a
      @data.actionTimes.push (Date.now() - @initTime)

      [r, s1] = @graph[s0][a]
      LOG_DEBUG "#{s0}, #{a} -> #{r}, #{s1}"
      @addScore r

      s1g = @states[s1]
      @player.animate {left: s1g.left, top: s1g.top},
          duration: dist(@player, s0) * 4
          onChange: @canvas.renderAll.bind(@canvas)
          onComplete: =>
            @arrive s1

    # Called when a state is clicked on.
    handleClick: (s) =>
      if @click?
        @click s

    # Called when the player arrives in a new state.
    arrive: (s) =>
      LOG_DEBUG 'arrive', s
      @data.path.push s

      # Get available actions.
      if @graph[s]
        keys = (@keys[a] for a in (Object.keys @graph[s]))
      else
        keys = []
      if not keys.length
        @complete = true
        @checkFinished()
        return

      # Start key listener.
      @keyListener = jsPsych.pluginAPI.getKeyboardResponse
        valid_responses: keys
        rt_method: 'date'
        persist: false
        allow_held_key: false
        callback_function: (info) =>
          action = @invKeys[info.key]
          LOG_DEBUG 'key', info.key
          @data.rt.push info.rt
          @handleKey s, action

    addScore: (v) =>
      @data.score = round (@data.score + v)
      $('#graph-score').html '$' + @data.score
      $('#graph-score').css 'color', redGreen @data.score


    # ---------- Starting the trial ---------- #

    run: =>
      LOG_DEBUG 'run'
      @buildMap()
      fabric.Image.fromURL @playerImage, ((img) =>
        @initPlayer img
        @canvas.renderAll()
        @initTime = Date.now()
        @arrive @initial
      )

    # Draw object on the canvas.
    draw: (obj) =>
      @canvas.add obj
      return obj


    # Draws the player image.
    initPlayer: (img) =>
      LOG_DEBUG 'initPlayer'
      top = @states[@initial].top
      left = @states[@initial].left
      img.scale(0.3)
      img.set('top', top).set('left', left)
      @draw img
      @player = img

    # Constructs the visual display.
    buildMap: =>
      # Resize canvas.
      [width, height] = do =>
        [xs, ys] = _.unzip (_.values @layout)
        [(_.max xs) + 1, (_.max ys) + 1]
      @canvasElement.attr(width: width * SIZE, height: height * SIZE)
      @canvas = new fabric.Canvas 'graph-canvas', selection: false

      @states = {}
      for name, location of @layout
        [x, y] = location
        @states[name] = @draw new State name, x, y,
          fill: '#bbb'
          label: if @showStateNames then name else ''

      for s0, actions of @graph
        for a, [reward, s1] of actions
          @draw new Edge @states[s0], @states[s1],
            reward: if @showRewards then reward else ''


    # ---------- ENDING THE TRIAL ---------- #

    # Creates a button allowing user to move to the next trial.
    endTrial: =>
      @lowerMessage.html """<b>Press any key to continue.</br>"""
      @keyListener = jsPsych.pluginAPI.getKeyboardResponse
        valid_responses: []
        rt_method: 'date'
        persist: false
        allow_held_key: false
        callback_function: (info) =>
          @display.empty()
          jsPsych.finishTrial @data

    checkFinished: =>
      if @complete
        @endTrial()


  #  =========================== #
  #  ========= Graphics ========= #
  #  =========================== #

  class State extends fabric.Group
    constructor: (@name, left, top, config={}) ->
      left = left * SIZE
      top = top * SIZE
      conf =
        left: left
        top: top
        fill: '#bbbbbb'
        radius: SIZE / 4
        label: ''
      _.extend conf, config
      # @x = @left = left
      # @y = @top = top
      @on('mousedown', -> mdp.handleClick @name)
      @circle = new fabric.Circle conf
      @label = new Text conf.label, left, top,
        fontSize: SIZE / 6
        fill: '#44d'
      @radius = @circle.radius
      @left = @circle.left
      @top = @circle.top
      super [@circle, @label]

    setLabel: (txt) ->
      if txt
        @label.setText txt
        @label.setFill (redGreen txt)
      else
        @label.setText ''
      @dirty = true


  class Edge extends fabric.Group
    constructor: (c1, c2, conf={}) ->
      {
        reward
        spacing=8
        adjX=0
        adjY=0
        rotateLabel=false
      } = conf

      [x1, y1, x2, y2] = [c1.left + adjX, c1.top + adjY, c2.left + adjX, c2.top + adjY]

      @arrow = new Arrow(x1, y1, x2, y2,
                         c1.radius + spacing, c2.radius + spacing)

      ang = (@arrow.ang + Math.PI / 2) % (Math.PI * 2)
      if 0.5 * Math.PI <= ang <= 1.5 * Math.PI
        ang += Math.PI

      
      [labX, labY] = polarMove(x1, y1, angle(x1, y1, x2, y2), SIZE * 0.45)

      txt = "#{reward}"
      @label = new Text txt, labX, labY,
        angle: if rotateLabel then (ang * 180 / Math.PI) else 0
        fill: redGreen reward
        fontSize: SIZE / 6
        textBackgroundColor: 'white'
      
      super [@arrow, @label]


  class Arrow extends fabric.Group
    constructor: (x1, y1, x2, y2, adj1=0, adj2=0) ->
      @ang = ang = (angle x1, y1, x2, y2)
      [x1, y1] = polarMove(x1, y1, ang, adj1)
      [x2, y2] = polarMove(x2, y2, ang, - (adj2+7.5))

      line = new fabric.Line [x1, y1, x2, y2],
        stroke: '#555'
        selectable: false
        strokeWidth: 3

      @centerX = (x1 + x2) / 2
      @centerY = (y1 + y2) / 2
      deltaX = line.left - @centerX
      deltaY = line.top - @centerY
      dx = x2 - x1
      dy = y2 - y1

      point = new (fabric.Triangle)(
        left: x2 + deltaX
        top: y2 + deltaY
        pointType: 'arrow_start'
        angle: ang * 180 / Math.PI
        width: 10
        height: 10
        fill: '#555')

      super [line, point]


  class Text extends fabric.Text
    constructor: (txt, left, top, config) ->
      txt = String(txt)
      conf =
        left: left
        top: top
        fontFamily: 'helvetica'
        fontSize: SIZE / 8

      _.extend conf, config
      super txt, conf


  # ================================= #
  # ========= jsPsych stuff ========= #
  # ================================= #
  
  plugin =
    trial: (display_element, trialConfig) ->
      trialConfig = jsPsych.pluginAPI.evaluateFunctionParameters(trialConfig)
      trialConfig.display = display_element

      console.log 'trialConfig', trialConfig

      display_element.empty()
      trial = new GraphMDP trialConfig
      trial.run()
      if trialConfig._block
        trialConfig._block.trialCount += 1
      TRIAL_INDEX += 1

  return plugin

# ---
# generated by js2coffee 2.2.0