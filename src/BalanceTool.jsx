import { useEffect, useMemo, useRef, useState } from 'react'
import { ethers } from 'ethers'
import TronWebPkg from 'tronweb'
import './BalanceTool.css'

const TronWeb = TronWebPkg?.TronWeb || TronWebPkg

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
]

const TOKEN_PRESETS = {
  ETH: [
    { id: 'usdt', symbol: 'USDT', name: 'Tether USD', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7' },
    { id: 'usdc', symbol: 'USDC', name: 'USD Coin', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
  ],
  BSC: [
    { id: 'usdt', symbol: 'USDT', name: 'Tether USD', address: '0x55d398326f99059fF775485246999027B3197955' },
    { id: 'usdc', symbol: 'USDC', name: 'USD Coin', address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d' },
  ],
  POLYGON: [
    { id: 'usdt', symbol: 'USDT', name: 'Tether USD', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F' },
    { id: 'usdc', symbol: 'USDC', name: 'USDC (Native)', address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359' },
    { id: 'usdc.e', symbol: 'USDC.e', name: 'USDC.e (Bridged)', address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174' },
  ],
  ARBITRUM: [
    { id: 'usdt', symbol: 'USDT', name: 'Tether USD', address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9' },
    { id: 'usdc', symbol: 'USDC', name: 'USDC (Native)', address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' },
    { id: 'usdc.e', symbol: 'USDC.e', name: 'USDC.e (Bridged)', address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8' },
  ],
  OPTIMISM: [
    { id: 'usdt', symbol: 'USDT', name: 'Tether USD', address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58' },
    { id: 'usdc', symbol: 'USDC', name: 'USDC (Native)', address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85' },
    { id: 'usdc.e', symbol: 'USDC.e', name: 'USDC.e (Bridged)', address: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607' },
  ],
  BASE: [
    { id: 'usdc', symbol: 'USDC', name: 'USDC (Native)', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' },
    { id: 'usdbc', symbol: 'USDbC', name: 'USDbC (Bridged USDC)', address: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA' },
    { id: 'usdt', symbol: 'USDT', name: 'USDT (Bridged)', address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2' },
  ],
  AVAX: [
    { id: 'usdc', symbol: 'USDC', name: 'USD Coin', address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E' },
    { id: 'usdt', symbol: 'USDT', name: 'Tether USD', address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7' },
  ],
  TRON: [
    { id: 'usdt', symbol: 'USDT', name: 'USDT (TRC20)', address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t' },
    { id: 'usdc', symbol: 'USDC', name: 'USDC (TRC20)', address: 'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8' },
    { id: 'usdc-tron-peg', symbol: 'USDC', name: 'USDC (Tron-Peg)', address: 'TLZSucJRjnqBKwvQz6n5hd29gbS4P7u7w8' },
  ],
}

const DEFAULT_PROJECTS = ['默认项目']
const DEFAULT_PROJECT_NAME = '默认项目'
const DEFAULT_USER = { id: '', name: '' }

function normalizeProjectName(name) {
  return String(name || '').trim()
}

const DEFAULT_CHAINS = [
  {
    key: 'ETH',
    name: 'Ethereum',
    chainType: 'EVM',
    chainId: 1,
    rpcUrl: 'https://ethereum.publicnode.com',
    explorer: 'https://etherscan.io',
  },
  {
    key: 'BSC',
    name: 'BSC',
    chainType: 'EVM',
    chainId: 56,
    rpcUrl: 'https://bsc-dataseed.binance.org/',
    explorer: 'https://bscscan.com',
  },
  {
    key: 'POLYGON',
    name: 'Polygon',
    chainType: 'EVM',
    chainId: 137,
    rpcUrl: 'https://polygon-rpc.com',
    explorer: 'https://polygonscan.com',
  },
  {
    key: 'ARBITRUM',
    name: 'Arbitrum One',
    chainType: 'EVM',
    chainId: 42161,
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorer: 'https://arbiscan.io',
  },
  {
    key: 'OPTIMISM',
    name: 'Optimism',
    chainType: 'EVM',
    chainId: 10,
    rpcUrl: 'https://mainnet.optimism.io',
    explorer: 'https://optimistic.etherscan.io',
  },
  {
    key: 'BASE',
    name: 'Base',
    chainType: 'EVM',
    chainId: 8453,
    rpcUrl: 'https://mainnet.base.org',
    explorer: 'https://basescan.org',
  },
  {
    key: 'AVAX',
    name: 'Avalanche C-Chain',
    chainType: 'EVM',
    chainId: 43114,
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    explorer: 'https://snowtrace.io',
  },
  {
    key: 'TRON',
    name: 'TRON',
    chainType: 'TRON',
    rpcUrl: '/tron',
    explorer: 'https://tronscan.org',
    tronProApiKey: '',
  },
]

function safeJsonParse(text) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`
}

function downloadTextFile(filename, text) {
  const blob = new Blob([text], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function safeStringify(obj) {
  try {
    return JSON.stringify(obj, null, 2)
  } catch {
    return ''
  }
}

function useLocalStorageState(key, initialValue) {
  const [value, setValue] = useState(() => {
    const raw = localStorage.getItem(key)
    if (!raw) return initialValue
    const parsed = safeJsonParse(raw)
    return parsed ?? initialValue
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue]
}

function normalizeRpcUrl(s) {
  if (!s) return ''
  const raw = String(s).trim()
  if (!raw) return ''
  try {
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
    const url = new URL(raw, base)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return ''
    return url.toString()
  } catch {
    return ''
  }
}

function isRpcUrl(s) {
  return !!normalizeRpcUrl(s)
}

function shortAddress(address) {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function nowZh() {
  return new Date().toLocaleString('zh-CN')
}

function getNetwork(chainId) {
  const cid = Number(chainId)
  if (!Number.isFinite(cid) || cid <= 0) return undefined
  return { chainId: cid, name: `chain-${cid}` }
}

function normalizeTronAddress(address) {
  if (!address) return ''
  const a = address.trim()
  if (/^41[0-9a-fA-F]{40}$/.test(a)) {
    try {
      return TronWeb.address.fromHex(a)
    } catch {
      return a
    }
  }
  return a
}

function isTronAddress(address) {
  if (!address) return false
  const a = address.trim()
  if (/^41[0-9a-fA-F]{40}$/.test(a)) return true
  try {
    return TronWeb.isAddress(a)
  } catch {
    return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(a)
  }
}

function normalizeHexNo0x(hex) {
  const h = String(hex || '').trim()
  if (!h) return ''
  return h.startsWith('0x') || h.startsWith('0X') ? h.slice(2) : h
}

function encodeTronAddressParameter(tronWeb, addressBase58OrHex41) {
  const addr = normalizeTronAddress(addressBase58OrHex41)
  const hex = normalizeHexNo0x(tronWeb.address.toHex(addr))
  return hex.padStart(64, '0')
}

function getExplorerLink(chainType, explorer, kind, value) {
  if (!explorer) return ''
  if (!value) return ''
  const base = explorer.replace(/\/+$/, '')
  if (chainType === 'TRON') {
    if (kind === 'token' || kind === 'contract') return `${base}/#/contract/${value}`
    return `${base}/#/address/${value}`
  }
  if (kind === 'token' || kind === 'contract') return `${base}/token/${value}`
  return `${base}/address/${value}`
}

function playBeep() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 880
    gain.gain.value = 0.04
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    setTimeout(() => {
      osc.stop()
      ctx.close().catch(() => {})
    }, 160)
  } catch {}
}

async function ensureNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  try {
    return await Notification.requestPermission()
  } catch {
    return 'denied'
  }
}

function sendNotification(title, body) {
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  try {
    new Notification(title, { body })
  } catch {}
}

function speak(text) {
  if (!('speechSynthesis' in window)) return
  try {
    // 停止之前的播报
    window.speechSynthesis.cancel()
    const msg = new SpeechSynthesisUtterance(text)
    msg.lang = 'zh-CN'
    msg.rate = 1.0
    window.speechSynthesis.speak(msg)
  } catch {}
}

export default function BalanceTool() {
  const [chains, setChains] = useLocalStorageState('mcbt:chains', DEFAULT_CHAINS)
  const [queries, setQueries] = useLocalStorageState('mcbt:queries', [])
  const [projects, setProjects] = useLocalStorageState('mcbt:projects', DEFAULT_PROJECTS)
  const [selectedProjectName, setSelectedProjectName] = useLocalStorageState('mcbt:selectedProject', DEFAULT_PROJECT_NAME)
  const [user, setUser] = useLocalStorageState('mcbt:user', { ...DEFAULT_USER, id: makeId() })
  const [refreshEnabled, setRefreshEnabled] = useLocalStorageState('mcbt:refreshEnabled', true)
  const [refreshSeconds, setRefreshSeconds] = useLocalStorageState('mcbt:refreshSeconds', 30)

  const providerCacheRef = useRef(new Map())
  const lastAlertStateRef = useRef(new Map())
  const importFileRef = useRef(null)

  const [selectedChainKey, setSelectedChainKey] = useState(chains[0]?.key || 'ETH')
  const selectedChain = useMemo(() => chains.find(c => c.key === selectedChainKey) || chains[0], [chains, selectedChainKey])

  const [rpcUrl, setRpcUrl] = useState(selectedChain?.rpcUrl || '')
  const [chainId, setChainId] = useState(selectedChain?.chainId || '')
  const [tronProApiKey, setTronProApiKey] = useState(selectedChain?.tronProApiKey || '')

  const [holderAddress, setHolderAddress] = useState('')
  const [tokenAddress, setTokenAddress] = useState('')
  const [tokenSymbol, setTokenSymbol] = useState('')
  const [tokenPresetId, setTokenPresetId] = useState('')
  const [newProjectName, setNewProjectName] = useState('')

  const [alertEnabled, setAlertEnabled] = useState(false)
  const [alertDirection, setAlertDirection] = useState('below')
  const [alertThreshold, setAlertThreshold] = useState('')

  const [formError, setFormError] = useState('')

  useEffect(() => {
    setUser(prev => {
      const id = prev?.id || makeId()
      const name = typeof prev?.name === 'string' ? prev.name : ''
      if (id === prev?.id && name === prev?.name) return prev
      return { id, name }
    })
  }, [setUser])

  const tokenPresets = useMemo(() => TOKEN_PRESETS[selectedChainKey] || [], [selectedChainKey])
  const selectedTokenPreset = useMemo(
    () => tokenPresets.find(t => t.id === tokenPresetId) || null,
    [tokenPresets, tokenPresetId]
  )

  const exportConfig = () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      user,
      chains,
      projects,
      selectedProjectName,
      queries,
      refreshEnabled,
      refreshSeconds,
    }
    const text = safeStringify(payload)
    if (!text) return
    const safeName = (user?.name || 'user').replace(/[\\/:*?"<>|]/g, '_').slice(0, 40) || 'user'
    downloadTextFile(`mcbt-config-${safeName}.json`, text)
  }

  const copyConfigToClipboard = async () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      user,
      chains,
      projects,
      selectedProjectName,
      queries,
      refreshEnabled,
      refreshSeconds,
    }
    const text = safeStringify(payload)
    if (!text) return
    await navigator.clipboard.writeText(text)
  }

  const isPlainObject = v => !!v && typeof v === 'object' && !Array.isArray(v)

  const sanitizeChain = c => {
    if (!isPlainObject(c)) return null
    const key = typeof c.key === 'string' ? c.key.trim() : ''
    if (!key) return null
    const chainType = c.chainType === 'TRON' ? 'TRON' : 'EVM'
    const name = typeof c.name === 'string' && c.name.trim() ? c.name.trim() : key
    const rpcUrl = typeof c.rpcUrl === 'string' ? c.rpcUrl.trim() : ''
    const explorer = typeof c.explorer === 'string' ? c.explorer.trim() : ''
    const chainId = chainType === 'EVM' ? (Number.isFinite(Number(c.chainId)) ? Number(c.chainId) : undefined) : undefined
    const tronProApiKey = chainType === 'TRON' ? (typeof c.tronProApiKey === 'string' ? c.tronProApiKey : '') : ''
    return { key, name, chainType, chainId, rpcUrl, explorer, tronProApiKey }
  }

  const sanitizeQuery = q => {
    if (!isPlainObject(q)) return null
    const chainKey = typeof q.chainKey === 'string' ? q.chainKey.trim() : ''
    const chainTypeRaw = typeof q.chainType === 'string' ? q.chainType.trim() : ''
    const chainType = chainTypeRaw === 'TRON' ? 'TRON' : chainKey === 'TRON' ? 'TRON' : 'EVM'

    const id = typeof q.id === 'string' && q.id ? q.id : makeId()
    const projectName = normalizeProjectName(q.projectName) || DEFAULT_PROJECT_NAME
    const chainName = typeof q.chainName === 'string' && q.chainName.trim() ? q.chainName.trim() : chainKey || 'CHAIN'
    const rpcUrl = typeof q.rpcUrl === 'string' ? q.rpcUrl.trim() : ''
    const explorer = typeof q.explorer === 'string' ? q.explorer.trim() : ''
    const holderAddress = typeof q.holderAddress === 'string' ? q.holderAddress.trim() : ''
    const tokenAddress = typeof q.tokenAddress === 'string' ? q.tokenAddress.trim() : ''
    const symbolInput = typeof q.symbolInput === 'string' ? q.symbolInput.trim() : ''
    const symbolResolved = typeof q.symbolResolved === 'string' ? q.symbolResolved.trim() : ''
    const nameResolved = typeof q.nameResolved === 'string' ? q.nameResolved.trim() : ''
    const tronProApiKey = chainType === 'TRON' ? (typeof q.tronProApiKey === 'string' ? q.tronProApiKey : '') : ''
    const chainId = chainType === 'EVM' ? (q.chainId == null ? undefined : Number(q.chainId)) : undefined
    const decimals = q.decimals == null ? null : Number(q.decimals)

    const alert = isPlainObject(q.alert)
      ? {
          enabled: !!q.alert.enabled,
          direction: q.alert.direction === 'above' ? 'above' : 'below',
          threshold: typeof q.alert.threshold === 'string' ? q.alert.threshold : '',
        }
      : { enabled: false, direction: 'below', threshold: '' }

    return {
      id,
      projectName,
      chainKey,
      chainName,
      chainType,
      chainId: Number.isFinite(chainId) ? chainId : undefined,
      rpcUrl,
      explorer,
      tronProApiKey,
      holderAddress,
      tokenAddress,
      symbolInput,
      symbolResolved,
      nameResolved,
      decimals: Number.isFinite(decimals) ? decimals : null,
      balance: typeof q.balance === 'string' ? q.balance : '',
      lastUpdated: typeof q.lastUpdated === 'string' ? q.lastUpdated : '',
      loading: false,
      error: typeof q.error === 'string' ? q.error : '',
      alert,
      alerting: !!q.alerting,
      alertTriggeredAt: typeof q.alertTriggeredAt === 'string' ? q.alertTriggeredAt : '',
    }
  }

  const applyImportedConfig = (data, mode) => {
    if (!isPlainObject(data)) throw new Error('配置文件格式不正确')

    const nextUser = isPlainObject(data.user) ? { id: String(data.user.id || ''), name: String(data.user.name || '') } : null
    const nextChains = Array.isArray(data.chains) ? data.chains.map(sanitizeChain).filter(Boolean) : null
    const nextProjects = Array.isArray(data.projects) ? data.projects : null
    const nextSelectedProjectName = typeof data.selectedProjectName === 'string' ? data.selectedProjectName : null
    const nextQueries = Array.isArray(data.queries) ? data.queries.map(sanitizeQuery).filter(Boolean) : null
    const nextRefreshEnabled = typeof data.refreshEnabled === 'boolean' ? data.refreshEnabled : null
    const nextRefreshSeconds = data.refreshSeconds != null ? Number(data.refreshSeconds) : null

    if (mode === 'replace') {
      if (nextUser) setUser({ id: nextUser.id || makeId(), name: nextUser.name || '' })
      if (nextChains) setChains(nextChains)
      if (nextProjects) setProjects(nextProjects)
      if (nextSelectedProjectName != null) setSelectedProjectName(nextSelectedProjectName)
      if (nextQueries) setQueries(nextQueries)
      if (nextRefreshEnabled != null) setRefreshEnabled(nextRefreshEnabled)
      if (Number.isFinite(nextRefreshSeconds) && nextRefreshSeconds > 0) setRefreshSeconds(nextRefreshSeconds)
      return
    }

    if (nextUser) setUser(prev => ({ id: prev?.id || makeId(), name: nextUser.name || prev?.name || '' }))

    if (nextChains) {
      setChains(prev => {
        const byKey = new Map(prev.map(c => [c.key, c]))
        for (const c of nextChains) {
          if (!c?.key) continue
          byKey.set(c.key, c)
        }
        return Array.from(byKey.values())
      })
    }

    if (nextProjects) {
      setProjects(prev => {
        const set = new Set(prev.map(normalizeProjectName).filter(Boolean))
        for (const p of nextProjects) {
          const n = normalizeProjectName(p)
          if (n) set.add(n)
        }
        set.add(DEFAULT_PROJECT_NAME)
        return Array.from(set)
      })
    }

    if (nextSelectedProjectName != null) {
      const n = normalizeProjectName(nextSelectedProjectName) || DEFAULT_PROJECT_NAME
      setSelectedProjectName(n)
    }

    if (nextQueries) {
      setQueries(prev => {
        const existing = new Set(prev.map(q => q.id))
        const merged = [...prev]
        for (const q of nextQueries) {
          if (!q) continue
          const id = typeof q.id === 'string' && q.id ? q.id : makeId()
          const safeId = existing.has(id) ? makeId() : id
          existing.add(safeId)
          merged.push({ ...q, id: safeId })
        }
        return merged
      })
    }

    if (nextRefreshEnabled != null) setRefreshEnabled(nextRefreshEnabled)
    if (Number.isFinite(nextRefreshSeconds) && nextRefreshSeconds > 0) setRefreshSeconds(nextRefreshSeconds)
  }

  const importConfigFromFile = async (file, mode) => {
    const text = await file.text()
    const data = safeJsonParse(text)
    if (!data) throw new Error('配置文件不是有效 JSON')
    applyImportedConfig(data, mode)
  }

  const openImportDialog = mode => {
    const el = importFileRef.current
    if (!el) return
    el.dataset.mode = mode
    el.value = ''
    el.click()
  }

  const onImportFileChange = async e => {
    const file = e.target.files?.[0]
    if (!file) return
    const mode = e.target.dataset.mode === 'merge' ? 'merge' : 'replace'
    try {
      await importConfigFromFile(file, mode)
    } catch (err) {
      const message = err?.message ? String(err.message) : '导入失败'
      alert(message)
    }
  }

  const restoreFromClipboard = async mode => {
    const text = await navigator.clipboard.readText()
    const data = safeJsonParse(text)
    if (!data) throw new Error('剪贴板内容不是有效 JSON')
    applyImportedConfig(data, mode)
  }

  const ensureProject = projectName => {
    const normalized = normalizeProjectName(projectName)
    if (!normalized) return DEFAULT_PROJECT_NAME
    setProjects(prev => {
      const set = new Set(prev.map(normalizeProjectName).filter(Boolean))
      set.add(DEFAULT_PROJECT_NAME)
      set.add(normalized)
      return Array.from(set)
    })
    return normalized
  }

  const addProject = () => {
    const name = normalizeProjectName(newProjectName)
    if (!name) return
    const ensured = ensureProject(name)
    setSelectedProjectName(ensured)
    setNewProjectName('')
  }

  useEffect(() => {
    setProjects(prev => {
      const set = new Set(prev.map(normalizeProjectName).filter(Boolean))
      set.add(DEFAULT_PROJECT_NAME)
      return Array.from(set)
    })
  }, [setProjects])

  useEffect(() => {
    const normalizedSelected = normalizeProjectName(selectedProjectName) || DEFAULT_PROJECT_NAME
    if (normalizedSelected !== selectedProjectName) setSelectedProjectName(normalizedSelected)
    if (!projects.map(normalizeProjectName).includes(normalizedSelected)) setSelectedProjectName(DEFAULT_PROJECT_NAME)
  }, [projects, selectedProjectName, setSelectedProjectName])

  useEffect(() => {
    setChains(prev => {
      let changed = false
      const next = prev.map(c => {
        const chainType = c.chainType || 'EVM'
        if (c.chainType !== chainType) changed = true
        if (c.key === 'TRON') {
          const rpcUrl = c.rpcUrl || ''
          const nextRpcUrl = rpcUrl === 'https://api.trongrid.io' || rpcUrl === 'http://api.trongrid.io' || rpcUrl === '' ? '/tron' : rpcUrl
          const tronProApiKey = c.tronProApiKey || ''
          if (nextRpcUrl !== rpcUrl) changed = true
          if (tronProApiKey !== c.tronProApiKey) changed = true
          return { ...c, chainType, rpcUrl: nextRpcUrl, tronProApiKey }
        }
        return { ...c, chainType }
      })
      if (!next.some(c => c.key === 'TRON')) {
        const tron = DEFAULT_CHAINS.find(c => c.key === 'TRON')
        if (tron) {
          changed = true
          next.push(tron)
        }
      }
      return changed ? next : prev
    })
  }, [setChains])

  useEffect(() => {
    setQueries(prev => {
      let changed = false
      const next = prev.map(q => {
        const chainType = q.chainType || (q.chainKey === 'TRON' ? 'TRON' : 'EVM')
        const rpcUrl = q.rpcUrl || ''
        const nextRpcUrl =
          chainType === 'TRON' && (rpcUrl === 'https://api.trongrid.io' || rpcUrl === 'http://api.trongrid.io' || rpcUrl === '')
            ? '/tron'
            : rpcUrl
        const holderAddress = chainType === 'TRON' ? normalizeTronAddress(q.holderAddress || '') : q.holderAddress
        const tokenAddress = chainType === 'TRON' ? normalizeTronAddress(q.tokenAddress || '') : q.tokenAddress
        const tronProApiKey = chainType === 'TRON' ? q.tronProApiKey || '' : ''
        const projectName = normalizeProjectName(q.projectName) || DEFAULT_PROJECT_NAME

        if (chainType !== q.chainType) changed = true
        if (nextRpcUrl !== rpcUrl) changed = true
        if (holderAddress !== q.holderAddress) changed = true
        if (tokenAddress !== q.tokenAddress) changed = true
        if (tronProApiKey !== q.tronProApiKey) changed = true
        if (projectName !== q.projectName) changed = true

        return { ...q, chainType, rpcUrl: nextRpcUrl, holderAddress, tokenAddress, tronProApiKey, projectName }
      })
      return changed ? next : prev
    })
  }, [setQueries])

  useEffect(() => {
    if (!selectedChain) return
    setRpcUrl(selectedChain.rpcUrl || '')
    setChainId(selectedChain.chainType === 'EVM' ? selectedChain.chainId || '' : '')
    setTronProApiKey(selectedChain.chainType === 'TRON' ? selectedChain.tronProApiKey || '' : '')
    setTokenPresetId('')
  }, [selectedChainKey])

  const getEvmProvider = (rpc, cid) => {
    const rpcNormalized = normalizeRpcUrl(rpc)
    const key = `evm::${rpcNormalized}::${cid || ''}`
    const cached = providerCacheRef.current.get(key)
    if (cached) return cached
    const provider = new ethers.providers.JsonRpcProvider(rpcNormalized, getNetwork(cid))
    providerCacheRef.current.set(key, provider)
    return provider
  }

  const getTronWeb = (fullHost, apiKey) => {
    const fullHostNormalized = normalizeRpcUrl(fullHost)
    const key = `tron::${fullHostNormalized}::${apiKey || ''}`
    const cached = providerCacheRef.current.get(key)
    if (cached) return cached
    const headers = apiKey ? { 'TRON-PRO-API-KEY': apiKey } : undefined
    const tronWeb = new TronWeb({ fullHost: fullHostNormalized, headers })
    providerCacheRef.current.set(key, tronWeb)
    return tronWeb
  }

  const updateQuery = (id, patchOrUpdater) => {
    setQueries(prev =>
      prev.map(q => {
        if (q.id !== id) return q
        const patch = typeof patchOrUpdater === 'function' ? patchOrUpdater(q) : patchOrUpdater
        return { ...q, ...patch }
      })
    )
  }

  const removeQuery = id => {
    setQueries(prev => prev.filter(q => q.id !== id))
    lastAlertStateRef.current.delete(id)
  }

  const formatBalance = (balanceStr, symbol) => {
    const n = Number(balanceStr)
    if (!Number.isFinite(n)) return `${balanceStr} ${symbol || ''}`.trim()
    return `${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol || ''}`.trim()
  }

  const evaluateAlert = (id, balanceBN, decimals, cfg) => {
    if (!cfg?.enabled) return { alerting: false, triggered: false }
    if (!cfg.threshold) return { alerting: false, triggered: false }

    let thresholdBN
    try {
      thresholdBN = ethers.utils.parseUnits(cfg.threshold, decimals)
    } catch {
      return { alerting: false, triggered: false }
    }

    const alerting = cfg.direction === 'above' ? balanceBN.gt(thresholdBN) : balanceBN.lt(thresholdBN)
    // 之前逻辑：triggered = alerting && !lastAlerting
    // 新逻辑：只要满足条件就触发报警（triggered = alerting）
    const triggered = alerting 
    lastAlertStateRef.current.set(id, alerting)
    return { alerting, triggered }
  }

  const fetchOne = async id => {
    const q = queries.find(x => x.id === id)
    if (!q) return

    updateQuery(id, { loading: true, error: '' })

    try {
      let balanceBN
      let decimalsRaw
      let symbolRaw
      let nameRaw

      if ((q.chainType || 'EVM') === 'TRON') {
        const tronWeb = getTronWeb(q.rpcUrl, q.tronProApiKey)
        try {
          tronWeb.setAddress(q.holderAddress)
        } catch {}
        const contract = await tronWeb.contract().at(q.tokenAddress)

        const balanceRaw = await contract.methods.balanceOf(q.holderAddress).call()

        const [decimalsTron, symbolTron, nameTron] = await Promise.all([
          q.decimals != null ? Promise.resolve(q.decimals) : contract.methods.decimals().call().catch(() => null),
          q.symbolResolved ? Promise.resolve(q.symbolResolved) : contract.methods.symbol().call().catch(() => null),
          q.nameResolved ? Promise.resolve(q.nameResolved) : contract.methods.name().call().catch(() => null),
        ])

        balanceBN = ethers.BigNumber.from(balanceRaw.toString())
        decimalsRaw = decimalsTron
        symbolRaw = symbolTron
        nameRaw = nameTron
      } else {
        const provider = getEvmProvider(q.rpcUrl, q.chainId)
        const contract = new ethers.Contract(q.tokenAddress, ERC20_ABI, provider)

        const balancePromise = contract.balanceOf(q.holderAddress)
        const decimalsPromise = q.decimals != null ? Promise.resolve(q.decimals) : contract.decimals().catch(() => null)
        const symbolPromise = q.symbolResolved ? Promise.resolve(q.symbolResolved) : contract.symbol().catch(() => null)
        const namePromise = q.nameResolved ? Promise.resolve(q.nameResolved) : contract.name().catch(() => null)

        ;[balanceBN, decimalsRaw, symbolRaw, nameRaw] = await Promise.all([
          balancePromise,
          decimalsPromise,
          symbolPromise,
          namePromise,
        ])
      }

      const decimals = decimalsRaw == null ? 18 : Number(decimalsRaw)
      const symbolResolved = (symbolRaw && String(symbolRaw)) || q.symbolInput || ''
      const nameResolved = (nameRaw && String(nameRaw)) || q.nameResolved || ''

      const balanceStr = ethers.utils.formatUnits(balanceBN, decimals)
      const { alerting, triggered } = evaluateAlert(id, balanceBN, decimals, q.alert)

      updateQuery(id, prev => ({
        loading: false,
        error: '',
        decimals,
        symbolResolved,
        nameResolved,
        balance: balanceStr,
        lastUpdated: nowZh(),
        alerting,
        alertTriggeredAt: triggered ? nowZh() : prev.alertTriggeredAt,
      }))

      if (triggered) {
        // playBeep()
        const directionText = q.alert.direction === 'above' ? '高于' : '低于'
        const alertMsg = `警报，${q.projectName || DEFAULT_PROJECT_NAME}，${q.chainName}，${symbolResolved}，报警：余额${directionText} ${q.alert.threshold}`
        speak(alertMsg)
        sendNotification('余额报警', `${q.chainName} ${symbolResolved} ${formatBalance(balanceStr, symbolResolved)}\n${shortAddress(q.holderAddress)}`)
      }
    } catch (e) {
      const message = e?.message ? String(e.message) : '查询失败'
      updateQuery(id, { loading: false, error: message, lastUpdated: nowZh() })
    }
  }

  const refreshAll = async () => {
    await Promise.all(queries.map(q => fetchOne(q.id)))
  }

  const refreshProject = async projectName => {
    const ids = queries.filter(q => (q.projectName || DEFAULT_PROJECT_NAME) === projectName).map(q => q.id)
    await Promise.all(ids.map(id => fetchOne(id)))
  }

  useEffect(() => {
    if (!refreshEnabled) return
    const seconds = Math.max(5, Number(refreshSeconds) || 30)
    const t = setInterval(() => {
      if (queries.length === 0) return
      refreshAll().catch(() => {})
    }, seconds * 1000)
    return () => clearInterval(t)
  }, [refreshEnabled, refreshSeconds, queries])

  const addQuery = async () => {
    setFormError('')

    const rpc = rpcUrl.trim()
    const cid = chainId === '' ? undefined : Number(chainId)
    const holder = holderAddress.trim()
    const token = tokenAddress.trim()
    const symbolInput = tokenSymbol.trim()
    const chainType = selectedChain?.chainType || 'EVM'
    const preset = selectedTokenPreset
    const presetMatches =
      preset &&
      (chainType === 'TRON'
        ? normalizeTronAddress(token) === normalizeTronAddress(preset.address)
        : token.toLowerCase() === preset.address.toLowerCase())
    const projectName = ensureProject(selectedProjectName)

    if (!isRpcUrl(rpc)) return setFormError('RPC URL 需要是 http/https 地址，或使用 /tron 代理路径')

    let holderNormalized = holder
    let tokenNormalized = token

    if (chainType === 'TRON') {
      holderNormalized = normalizeTronAddress(holder)
      tokenNormalized = normalizeTronAddress(token)
      if (!isTronAddress(holderNormalized)) return setFormError('TRON 地址格式不正确')
      if (!isTronAddress(tokenNormalized)) return setFormError('TRON 代币合约地址格式不正确')
    } else {
      if (!ethers.utils.isAddress(holder)) return setFormError('地址格式不正确')
      if (!ethers.utils.isAddress(token)) return setFormError('代币合约地址格式不正确')
    }

    const chainName = selectedChain?.name || selectedChainKey
    const explorer = selectedChain?.explorer || ''

    const id = makeId()
    const newQuery = {
      id,
      projectName,
      chainKey: selectedChainKey,
      chainName,
      chainType,
      chainId: chainType === 'EVM' ? (Number.isFinite(cid) ? cid : selectedChain?.chainId) : undefined,
      rpcUrl: rpc,
      explorer,
      tronProApiKey: chainType === 'TRON' ? tronProApiKey.trim() : '',
      holderAddress: holderNormalized,
      tokenAddress: tokenNormalized,
      symbolInput,
      symbolResolved: presetMatches ? preset.symbol : '',
      nameResolved: presetMatches ? preset.name : '',
      decimals: null,
      balance: '',
      lastUpdated: '',
      loading: false,
      error: '',
      alert: {
        enabled: !!alertEnabled,
        direction: alertDirection,
        threshold: alertThreshold.trim(),
      },
      alerting: false,
      alertTriggeredAt: '',
      createdAt: nowZh(),
    }

    setQueries(prev => [newQuery, ...prev])

    setHolderAddress('')
    setTokenAddress('')
    setTokenSymbol('')

    fetchOne(id).catch(() => {})
  }

  const onToggleAlert = async id => {
    const perm = await ensureNotificationPermission()
    updateQuery(id, q => ({
      alert: { ...q.alert, enabled: !q.alert?.enabled },
      alerting: false,
      alertTriggeredAt: '',
      error: perm === 'denied' ? '浏览器通知权限被拒绝（仍会在页面内标红并蜂鸣）' : q.error,
    }))
    lastAlertStateRef.current.delete(id)
  }

  const updateChainRpc = (key, nextRpc) => {
    setChains(prev => prev.map(c => (c.key === key ? { ...c, rpcUrl: nextRpc } : c)))
  }

  const updateChainId = (key, nextChainId) => {
    setChains(prev =>
      prev.map(c => {
        if (c.key !== key) return c
        if ((c.chainType || 'EVM') !== 'EVM') return c
        const num = Number(nextChainId)
        return { ...c, chainId: Number.isFinite(num) ? num : c.chainId }
      })
    )
  }

  const updateChainTronApiKey = (key, nextKey) => {
    setChains(prev =>
      prev.map(c => {
        if (c.key !== key) return c
        if ((c.chainType || 'EVM') !== 'TRON') return c
        return { ...c, tronProApiKey: nextKey }
      })
    )
  }

  const selectedChainRow = useMemo(() => chains.find(c => c.key === selectedChainKey), [chains, selectedChainKey])
  const groupedByProject = useMemo(() => {
    const map = new Map()
    for (const q of queries) {
      const pn = normalizeProjectName(q.projectName) || DEFAULT_PROJECT_NAME
      const arr = map.get(pn) || []
      arr.push(q)
      map.set(pn, arr)
    }

    const totals = new Map()
    for (const [pn, list] of map.entries()) {
      const chainSet = new Set(list.map(x => x.chainName).filter(Boolean))
      const tokenSums = new Map()

      for (const q of list) {
        const n = Number(q.balance)
        if (!Number.isFinite(n)) continue
        const tokenKey = `${q.chainName || ''}|${q.tokenAddress || ''}`
        const prev = tokenSums.get(tokenKey) || {
          sum: 0,
          chainName: q.chainName || '',
          symbol: q.symbolResolved || q.symbolInput || '',
          tokenAddress: q.tokenAddress || '',
        }
        prev.sum += n
        tokenSums.set(tokenKey, prev)
      }

      const parts = Array.from(tokenSums.values())
        .filter(x => Number.isFinite(x.sum) && x.sum !== 0)
        .sort((a, b) => b.sum - a.sum)
        .map(x => {
          const label = x.symbol || shortAddress(x.tokenAddress)
          const amountText = Number(x.sum).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          return chainSet.size > 1 ? `${x.chainName} ${amountText} ${label}`.trim() : `${amountText} ${label}`.trim()
        })

      const totalText = parts.length > 3 ? `${parts.slice(0, 3).join(' | ')} +${parts.length - 3}` : parts.join(' | ')
      totals.set(pn, totalText)
    }

    const existing = new Set(map.keys())
    const ordered = []
    const normalizedProjects = projects.map(normalizeProjectName).filter(Boolean)
    for (const pn of normalizedProjects) {
      if (!existing.has(pn)) continue
      ordered.push(pn)
      existing.delete(pn)
    }
    for (const pn of Array.from(existing)) ordered.push(pn)

    return { ordered, map, totals }
  }, [projects, queries])

  return (
    <div className="mcbt">
      <div className="mcbt-header">
        <div className="mcbt-title">
          <h2>多链代币余额查询</h2>
          <div className="mcbt-subtitle">填入 地址、代币符号、代币合约 后创建查询标签，支持定时刷新与余额报警</div>
        </div>

        <div className="mcbt-controls">
          <label className="mcbt-inline">
            <input type="checkbox" checked={!!refreshEnabled} onChange={e => setRefreshEnabled(e.target.checked)} />
            定时刷新
          </label>
          <div className="mcbt-inline">
            <span>间隔(秒)</span>
            <input
              className="mcbt-input mcbt-input-sm"
              value={refreshSeconds}
              onChange={e => setRefreshSeconds(e.target.value)}
              inputMode="numeric"
            />
          </div>
          <button className="mcbt-btn" onClick={refreshAll} disabled={queries.length === 0}>
            刷新全部
          </button>
          <button className="mcbt-btn mcbt-btn-secondary" onClick={() => ensureNotificationPermission()}>
            允许通知
          </button>
          <button className="mcbt-btn mcbt-btn-secondary" onClick={() => speak('语音播报测试，系统正常')}>
            测试语音
          </button>
        </div>
      </div>

      <div className="mcbt-card">
        <div className="mcbt-card-title">用户与配置</div>
        <div className="mcbt-form">
          <div className="mcbt-row mcbt-row-2">
            <div className="mcbt-field">
              <label>用户名</label>
              <input
                className="mcbt-input"
                value={user?.name || ''}
                onChange={e => setUser(prev => ({ id: prev?.id || makeId(), name: e.target.value }))}
                placeholder="用于导出文件命名"
              />
            </div>
            <div className="mcbt-field">
              <label>用户ID</label>
              <input className="mcbt-input" value={user?.id || ''} readOnly />
            </div>
          </div>

          <div className="mcbt-config-actions">
            <button className="mcbt-btn mcbt-btn-primary" onClick={exportConfig}>
              导出配置(JSON)
            </button>
            <button
              className="mcbt-btn"
              onClick={async () => {
                try {
                  await copyConfigToClipboard()
                  alert('已复制配置到剪贴板')
                } catch (e) {
                  alert(e?.message ? String(e.message) : '复制失败')
                }
              }}
            >
              复制配置
            </button>
            <button className="mcbt-btn mcbt-btn-secondary" onClick={() => openImportDialog('replace')}>
              导入(覆盖)
            </button>
            <button className="mcbt-btn mcbt-btn-secondary" onClick={() => openImportDialog('merge')}>
              导入(合并)
            </button>
            <button
              className="mcbt-btn mcbt-btn-secondary"
              onClick={async () => {
                try {
                  await restoreFromClipboard('replace')
                  alert('已从剪贴板恢复(覆盖)')
                } catch (e) {
                  alert(e?.message ? String(e.message) : '恢复失败')
                }
              }}
            >
              从剪贴板恢复(覆盖)
            </button>
          </div>

          <input ref={importFileRef} type="file" accept="application/json" onChange={onImportFileChange} style={{ display: 'none' }} />
          <div className="mcbt-muted">
            清除浏览器缓存会清空本地数据。建议定期导出配置备份，或复制到剪贴板保存。
          </div>
        </div>
      </div>

      <div className="mcbt-card">
        <div className="mcbt-card-title">创建查询标签</div>

        {formError ? <div className="mcbt-error">{formError}</div> : null}

        <div className="mcbt-form">
          <div className="mcbt-row">
            <div className="mcbt-field">
              <label>链</label>
              <select className="mcbt-input" value={selectedChainKey} onChange={e => setSelectedChainKey(e.target.value)}>
                {chains.map(c => (
                  <option key={c.key} value={c.key}>
                    {c.name} ({(c.chainType || 'EVM') === 'EVM' ? c.chainId : 'TRON'})
                  </option>
                ))}
              </select>
            </div>

            <div className="mcbt-field">
              <label>RPC</label>
              <input className="mcbt-input" value={rpcUrl} onChange={e => setRpcUrl(e.target.value)} placeholder="https://..." />
            </div>

            {(selectedChainRow?.chainType || 'EVM') === 'EVM' ? (
              <div className="mcbt-field">
                <label>ChainId</label>
                <input
                  className="mcbt-input"
                  value={chainId}
                  onChange={e => setChainId(e.target.value)}
                  placeholder={selectedChainRow?.chainId ? String(selectedChainRow.chainId) : ''}
                  inputMode="numeric"
                />
              </div>
            ) : (
              <div className="mcbt-field">
                <label>TRON-PRO-API-KEY (可选)</label>
                <input
                  className="mcbt-input"
                  value={tronProApiKey}
                  onChange={e => setTronProApiKey(e.target.value)}
                  placeholder="用于 TronGrid 限流/权限"
                />
              </div>
            )}
          </div>

          <div className="mcbt-row mcbt-row-2">
            <div className="mcbt-field">
              <label>项目</label>
              <select className="mcbt-input" value={selectedProjectName} onChange={e => setSelectedProjectName(e.target.value)}>
                {projects.map(p => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="mcbt-field">
              <label>新项目</label>
              <div className="mcbt-project-add">
                <input
                  className="mcbt-input"
                  value={newProjectName}
                  onChange={e => setNewProjectName(e.target.value)}
                  placeholder="例如：项目A"
                />
                <button className="mcbt-btn mcbt-btn-secondary" onClick={addProject} disabled={!normalizeProjectName(newProjectName)}>
                  创建项目
                </button>
              </div>
            </div>
          </div>

          <div className="mcbt-row">
            <div className="mcbt-field mcbt-field-wide">
              <label>常用代币</label>
              <select
                className="mcbt-input"
                value={tokenPresetId}
                onChange={e => {
                  const nextId = e.target.value
                  setTokenPresetId(nextId)
                  const preset = tokenPresets.find(t => t.id === nextId)
                  if (!preset) return
                  setTokenAddress(preset.address)
                  setTokenSymbol(preset.symbol)
                }}
                disabled={tokenPresets.length === 0}
              >
                <option value="">手动填写</option>
                {tokenPresets.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.symbol} - {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mcbt-row">
            <div className="mcbt-field">
              <label>地址</label>
              <input
                className="mcbt-input"
                value={holderAddress}
                onChange={e => setHolderAddress(e.target.value)}
                placeholder={(selectedChainRow?.chainType || 'EVM') === 'TRON' ? 'T...' : '0x...'}
              />
            </div>

            <div className="mcbt-field">
              <label>代币合约</label>
              <input
                className="mcbt-input"
                value={tokenAddress}
                onChange={e => {
                  setTokenAddress(e.target.value)
                  if (tokenPresetId) setTokenPresetId('')
                }}
                placeholder={(selectedChainRow?.chainType || 'EVM') === 'TRON' ? 'T...' : '0x...'}
              />
            </div>

            <div className="mcbt-field">
              <label>代币符号</label>
              <input className="mcbt-input" value={tokenSymbol} onChange={e => setTokenSymbol(e.target.value)} placeholder="USDT" />
            </div>
          </div>

          <div className="mcbt-row">
            <div className="mcbt-field mcbt-field-wide">
              <label>余额报警</label>
              <div className="mcbt-alert-row">
                <label className="mcbt-inline">
                  <input type="checkbox" checked={!!alertEnabled} onChange={e => setAlertEnabled(e.target.checked)} />
                  启用
                </label>
                <select
                  className="mcbt-input mcbt-input-md"
                  value={alertDirection}
                  onChange={e => setAlertDirection(e.target.value)}
                  disabled={!alertEnabled}
                >
                  <option value="below">低于</option>
                  <option value="above">高于</option>
                </select>
                <input
                  className="mcbt-input mcbt-input-md"
                  value={alertThreshold}
                  onChange={e => setAlertThreshold(e.target.value)}
                  placeholder="阈值，例如 1000"
                  disabled={!alertEnabled}
                  inputMode="decimal"
                />
                <button className="mcbt-btn mcbt-btn-primary" onClick={addQuery}>
                  创建标签
                </button>
              </div>
            </div>
          </div>

          {selectedChainRow ? (
            <div className="mcbt-chain-hint">
              <span>当前链配置：</span>
              <span className="mcbt-muted">{selectedChainRow.key}</span>
              <span className="mcbt-muted">{selectedChainRow.chainType || 'EVM'}</span>
              <span className="mcbt-muted">RPC</span>
              <input
                className="mcbt-input mcbt-input-wide"
                value={selectedChainRow.rpcUrl}
                onChange={e => updateChainRpc(selectedChainRow.key, e.target.value)}
              />
              {(selectedChainRow.chainType || 'EVM') === 'EVM' ? (
                <>
                  <span className="mcbt-muted">ChainId</span>
                  <input
                    className="mcbt-input mcbt-input-sm"
                    value={selectedChainRow.chainId}
                    onChange={e => updateChainId(selectedChainRow.key, e.target.value)}
                    inputMode="numeric"
                  />
                </>
              ) : (
                <>
                  <span className="mcbt-muted">API Key</span>
                  <input
                    className="mcbt-input mcbt-input-wide"
                    value={selectedChainRow.tronProApiKey || ''}
                    onChange={e => updateChainTronApiKey(selectedChainRow.key, e.target.value)}
                    placeholder="TRON-PRO-API-KEY (可选)"
                  />
                </>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mcbt-list">
        {queries.length === 0 ? <div className="mcbt-empty">还没有查询标签</div> : null}

        {groupedByProject.ordered.map(projectName => {
          const list = groupedByProject.map.get(projectName) || []
          if (list.length === 0) return null
          const totalText = groupedByProject.totals.get(projectName) || ''
          return (
            <div key={projectName} className="mcbt-project">
              <div className="mcbt-project-head">
                <div className="mcbt-project-title">
                  <div className="mcbt-project-name">{projectName}</div>
                  <div className="mcbt-muted">{list.length} 个地址</div>
                  {totalText ? <div className="mcbt-muted">总额: {totalText}</div> : null}
                </div>
                <div className="mcbt-project-actions">
                  <button className="mcbt-btn mcbt-btn-secondary" onClick={() => refreshProject(projectName)}>
                    刷新项目
                  </button>
                </div>
              </div>

              <div className="mcbt-project-grid">
                {list.map(q => {
                  const symbol = q.symbolResolved || q.symbolInput || ''
                  const displayBalance = q.balance ? formatBalance(q.balance, symbol) : '--'
                  const addrLink = getExplorerLink(q.chainType || 'EVM', q.explorer || '', 'address', q.holderAddress)
                  const tokenLink = getExplorerLink(q.chainType || 'EVM', q.explorer || '', 'token', q.tokenAddress)
                  const alertText =
                    q.alert?.enabled && q.alert?.threshold
                      ? `${q.alert.direction === 'above' ? '高于' : '低于'} ${q.alert.threshold}`
                      : ''

                  return (
                    <div key={q.id} className={`mcbt-tag ${q.alerting ? 'alerting' : ''}`}>
                      <div className="mcbt-tag-head">
                        <div className="mcbt-tag-title">
                          <span className="mcbt-badge">{q.chainName}</span>
                          <span className="mcbt-tag-symbol">{symbol || shortAddress(q.tokenAddress)}</span>
                          {q.nameResolved ? <span className="mcbt-muted">({q.nameResolved})</span> : null}
                        </div>
                        <div className="mcbt-tag-actions">
                          <button className="mcbt-btn mcbt-btn-secondary" onClick={() => fetchOne(q.id)} disabled={q.loading}>
                            刷新
                          </button>
                          <button className="mcbt-btn mcbt-btn-danger" onClick={() => removeQuery(q.id)}>
                            删除
                          </button>
                        </div>
                      </div>

                      <div className="mcbt-tag-body">
                        <div className="mcbt-kv">
                          <div className="mcbt-k">地址</div>
                          <div className="mcbt-v">
                            {addrLink ? (
                              <a href={addrLink} target="_blank" rel="noreferrer" title={q.holderAddress}>
                                {shortAddress(q.holderAddress)}
                              </a>
                            ) : (
                              <span title={q.holderAddress}>{shortAddress(q.holderAddress)}</span>
                            )}
                          </div>
                        </div>
                        <div className="mcbt-kv">
                          <div className="mcbt-k">代币合约</div>
                          <div className="mcbt-v">
                            {tokenLink ? (
                              <a href={tokenLink} target="_blank" rel="noreferrer" title={q.tokenAddress}>
                                {shortAddress(q.tokenAddress)}
                              </a>
                            ) : (
                              <span title={q.tokenAddress}>{shortAddress(q.tokenAddress)}</span>
                            )}
                          </div>
                        </div>
                        <div className="mcbt-kv">
                          <div className="mcbt-k">余额</div>
                          <div className="mcbt-v">
                            <span className="mcbt-balance">{q.loading ? '加载中…' : displayBalance}</span>
                          </div>
                        </div>

                        <div className="mcbt-meta">
                          <div className="mcbt-meta-row">
                            <span className="mcbt-muted">更新时间: {q.lastUpdated || '--'}</span>
                            <span className="mcbt-muted">Decimals: {q.decimals == null ? '--' : q.decimals}</span>
                          </div>
                          <div className="mcbt-meta-row">
                            {q.error ? <span className="mcbt-error">{q.error}</span> : null}
                            {alertText ? <span className={`mcbt-alert-pill ${q.alerting ? 'on' : ''}`}>报警 {alertText}</span> : null}
                            {q.alertTriggeredAt ? <span className="mcbt-muted">触发: {q.alertTriggeredAt}</span> : null}
                          </div>
                        </div>

                        <div className="mcbt-alert-edit">
                          <div className="mcbt-inline">
                            <label className="mcbt-inline">
                              <input type="checkbox" checked={!!q.alert?.enabled} onChange={() => onToggleAlert(q.id)} />
                              启用报警
                            </label>
                          </div>
                          <select
                            className="mcbt-input mcbt-input-md"
                            value={q.alert?.direction || 'below'}
                            onChange={e => updateQuery(q.id, prev => ({ alert: { ...prev.alert, direction: e.target.value } }))}
                            disabled={!q.alert?.enabled}
                          >
                            <option value="below">低于</option>
                            <option value="above">高于</option>
                          </select>
                          <input
                            className="mcbt-input mcbt-input-md"
                            value={q.alert?.threshold || ''}
                            onChange={e => updateQuery(q.id, prev => ({ alert: { ...prev.alert, threshold: e.target.value } }))}
                            placeholder="阈值"
                            disabled={!q.alert?.enabled}
                            inputMode="decimal"
                          />
                          <button
                            className="mcbt-btn mcbt-btn-secondary"
                            onClick={() => {
                              lastAlertStateRef.current.delete(q.id)
                              updateQuery(q.id, { alerting: false, alertTriggeredAt: '' })
                            }}
                          >
                            重置触发
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

