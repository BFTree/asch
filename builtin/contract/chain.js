module.exports = {
  register: async function (name, desc, link, icon, delegates, unlockNumber) {
    let tid = this.trs.id
    let chainAddress = app.util.address.generateChainAddress(tid)

    let exists = await app.sdb.exists('Chain', { name: name })
    if (exists) return 'Chain name already registered'

    exists = await app.sdb.exists('Chain', { link: link })
    if (exists) return 'Chain link already registered'

    app.sdb.create('Account', { address: chainAddress, xas: 0, name: '' })
    app.sdb.create('Chain', {
      tid: tid,
      address: chainAddress,
      name,
      desc,
      link,
      icon,
      unlockNumber
    })
    for (let d of delegates) {
      app.sdb.create('ChainDelegate', {
        chain: name,
        delegate: d
      })
    }
  },

  replaceDelegate: async function (chain, from, to) {
    //app.sdb.update('ChainDelegate', { delegate: to }, { delegate: from, chain: chain })
  },

  addDelegate: async function (chain, key) {
    //app.sdb.create('ChainDelegate', { chain: chain, delegate: key })
    //app.sdb.increment('Chain', { unlockNumber: 1 }, { name: chain })
  },

  removeDelegate: async function (chain, key) {
    //app.sdb.del('ChainDelegate', { chain: chain, delegate: key })
    //app.sdb.increment('Chain', { unlockNumber: -1 }, { name: chain })
  },

  deposit: async function (chainName, currency, amount) {
    let chain = await app.sdb.findOne('Chain', { condition: { name: chainName } })
    if (!chain) return 'Chain not found'

    let senderId = this.trs.senderId
    if (currency !== 'XAS') {
      let balance = app.balances.get(senderId, currency)
      if (balance.lt(amount)) return 'Insufficient balance'

      app.balances.transfer(currency, amount, senderId, chain.address)
    } else {
      amount = Number(amount)
      let sender = await app.sdb.get('Account', senderId)
      if (!sender || !sender.xas || sender.xas < amount) return 'Insufficient balance'
      sender.xas -= amount

      let chainAccount = await app.sdb.get('Account', chain.address)
      chainAccount += amount
    }
    app.sdb.create('Deposit', {
      tid: this.trs.id,
      senderId: this.trs.senderId,
      chain: chainName,
      currency,
      amount,
      seq: Number(app.autoID.increment('deposit_seq'))
    })
  },

  withdrawal: async function (chainName, recipient, currency, amount, oid, seq) {
    let chain = await app.sdb.findOne('Chain', { condition: { name: chainName } })
    if (!chain) return 'Chain not found'

    let exists = await app.sdb.exists('Withdrawal', { chain: chainName, oid: oid })
    if (exists) return 'Chain withdrawal already processed'

    let validators = await app.sdb.findAll('ChainDelegate', { condition: { chain: chainName } })
    if (!validators || !validators.length) return 'Chain delegates not found'

    let validatorPublicKeySet = new Set
    for (let v of validators) {
      validatorPublicKeySet.add(v.delegate)
    }
    let validSignatureNumber = 0
    for (let s of this.trs.signatures) {
      let k = s.substr(0, 64)
      if (validatorPublicKeySet.has(k)) {
        validSignatureNumber++
      }
    }
    if (validSignatureNumber < chain.unlockNumber) return 'Signature not enough'

    if (currency !== 'XAS') {
      let balance = app.balances.get(chain.address, currency)
      if (balance.lt(amount)) return 'Insufficient balance'
      app.balances.transfer(currency, amount, chain.address, recipient)
    } else {
      amount = Number(amount)
      let sender = await app.sdb.get('Account', chain.address)
      if (!sender || !sender.xas || sender.xas < amount) return 'Insufficient balance'
      sender.xas -= amount
      let account = await app.sdb.get('Account', recipient)
      if (!account) {
        app.sdb.create('Account', {
          address: recipient,
          xas: amount,
          name: ''
        })
      } else {
        account.xas += amount
      }
    }
    app.sdb.create('Withdrawal', {
      tid: this.trs.id,
      chain: chain.name,
      currency,
      amount,
      recipientId: recipient,
      oid,
      seq
    })
  }
}