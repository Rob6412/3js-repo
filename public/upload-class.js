const defaults = {
  send_frequency: 950
}
const events = {
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  UPLOAD_COMPLETED: 'UPLOAD_COMPLETED',
  UPLOAD_STARTED: 'UPLOAD_STARTED',
  UPLOAD_SKIPPED_EMPTY_EVENTS: 'UPLOAD_SKIPPED_EMPTY_EVENTS',
  EVENT_RECEIVED: 'EVENT_RECEIVED',
  QUEUE_DRAINED: 'QUEUE_DRAINED',
  QUEUE_LENGTH: 'QUEUE_LENGTH',
}
class EventHandler extends EventTarget {
  constructor(options) {
    super()
    this.settings = {
      api_url: options.api_url,
      send_frequency: options.send_frequency || defaults.send_frequency,
      max_upload_size: 35
    }
    this.state = {
      events: [],
      is_uploading: false,
      event_number: 0
    }
  }
  addEvent (event) {
    this.dispatchEvent(new Event(events.EVENT_RECEIVED))
    this.state.events.push({
      ...event,
      time: (new Date()).toISOString(),
      event_number: this.state.event_number
    })
    this.state.event_number = this.state.event_number + 1
  }
  async schedular () {
    do {
      await sleep(this.state.send_frequency)
      this.dispatchEvent(new CustomEvent(events.QUEUE_LENGTH, { detail: this.state.events.length }))
      await this.beginUpload()
    } while (this.state.should_upload)
  }
  async beginUpload () {
    this.changeUploadState(true)
    const numberOfEvents = this.state.events.length
    if (numberOfEvents <= 0) {
      this.dispatchEvent(new Event(events.UPLOAD_SKIPPED_EMPTY_EVENTS))
      return this.changeUploadState(false)
    }
    const eventsToUpload = this.state.events.splice(0, this.settings.max_upload_size)
    const requestResponse = await this.sendRequest(eventsToUpload)
    if (!requestResponse) {
      this.state.events.unshift(...eventsToUpload)
      this.dispatchEvent(new Event(events.UPLOAD_FAILED))
    } else {
      this.dispatchEvent(new Event(events.UPLOAD_COMPLETED))
    }
    if (this.state.events.length === 0) {
      this.dispatchEvent(new Event(events.QUEUE_DRAINED))
    }
    return this.changeUploadState(false)
  }
  async sendRequest (events) {
    try {
      this.dispatchEvent(new Event(events.UPLOAD_STARTED))
      const response = await fetch(this.settings.api_url, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          events
        })
      })
      return response.ok
    } catch (error) {
      return false
    }
  }
  stopUpload () {
    this.state.should_upload = false
  }
  startUpload () {
    this.state.should_upload = true
    this.schedular() // Just begin this async function in the background
  }
  changeUploadState (uploading = false) {
    this.state.is_uploading = uploading
  }
}
const sleep = (sleepTime = 950) =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve()
    }, sleepTime)
  })
