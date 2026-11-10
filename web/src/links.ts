import { siAcm, siAlipay, siAmd, siAndroid, siAnsible, siApache, siApple, siArduino, siArxiv, siAsana, siAudacity, siBaidu, siBehance, siBilibili, siBitbucket, siBlender, siCloudflare, siConfluence, siDevdotto, siDigitalocean, siDiscord, siDjango, siDocker, siDouban, siDribbble, siDropbox, siEvernote, siFacebook, siFigma, siFlask, siGhost, siGimp, siGitee, siGithub, siGitlab, siGmail, siGo, siGoogle, siGooglecalendar, siGooglecloud, siGoogledocs, siGoogledrive, siGooglesheets, siGrafana, siHexo, siHtml5, siHugo, siIeee, siInkscape, siInstagram, siIntel, siJavascript, siJenkins, siJira, siKubernetes, siLaravel, siLinux, siMedium, siMeituan, siMongodb, siMysql, siNeteasecloudmusic, siNetflix, siNetlify, siNginx, siNodedotjs, siNotion, siNpm, siNvidia, siObsidian, siObsstudio, siOpenjdk, siPhp, siPostgresql, siProducthunt, siPrometheus, siProtonmail, siPubmed, siPython, siRaspberrypi, siReact, siReddit, siRedis, siRust, siSass, siSoundcloud, siSourceforge, siSpotify, siStackoverflow, siSteam, siTailwindcss, siTaobao, siTelegram, siTerraform, siTiktok, siTodoist, siTrello, siTwitch, siTypescript, siUbuntu, siUnity, siUnrealengine, siVercel, siVite, siVuedotjs, siVultr, siWechat, siWhatsapp, siWordpress, siX, siXiaohongshu, siYcombinator, siYoutube, siZhihu, siZoom } from 'simple-icons'

const ICONS: Record<string, string> = {
  acm: siAcm.path,
  alipay: siAlipay.path,
  amd: siAmd.path,
  android: siAndroid.path,
  ansible: siAnsible.path,
  apache: siApache.path,
  apple: siApple.path,
  arduino: siArduino.path,
  arxiv: siArxiv.path,
  asana: siAsana.path,
  audacity: siAudacity.path,
  baidu: siBaidu.path,
  behance: siBehance.path,
  bilibili: siBilibili.path,
  bitbucket: siBitbucket.path,
  blender: siBlender.path,
  cloudflare: siCloudflare.path,
  confluence: siConfluence.path,
  devdotto: siDevdotto.path,
  digitalocean: siDigitalocean.path,
  discord: siDiscord.path,
  django: siDjango.path,
  docker: siDocker.path,
  douban: siDouban.path,
  dribbble: siDribbble.path,
  dropbox: siDropbox.path,
  evernote: siEvernote.path,
  facebook: siFacebook.path,
  figma: siFigma.path,
  flask: siFlask.path,
  ghost: siGhost.path,
  gimp: siGimp.path,
  gitee: siGitee.path,
  github: siGithub.path,
  gitlab: siGitlab.path,
  gmail: siGmail.path,
  go: siGo.path,
  google: siGoogle.path,
  googlecalendar: siGooglecalendar.path,
  googlecloud: siGooglecloud.path,
  googledocs: siGoogledocs.path,
  googledrive: siGoogledrive.path,
  googlesheets: siGooglesheets.path,
  grafana: siGrafana.path,
  hexo: siHexo.path,
  html5: siHtml5.path,
  hugo: siHugo.path,
  ieee: siIeee.path,
  inkscape: siInkscape.path,
  instagram: siInstagram.path,
  intel: siIntel.path,
  javascript: siJavascript.path,
  jenkins: siJenkins.path,
  jira: siJira.path,
  kubernetes: siKubernetes.path,
  laravel: siLaravel.path,
  linux: siLinux.path,
  medium: siMedium.path,
  meituan: siMeituan.path,
  mongodb: siMongodb.path,
  mysql: siMysql.path,
  neteasecloudmusic: siNeteasecloudmusic.path,
  netflix: siNetflix.path,
  netlify: siNetlify.path,
  nginx: siNginx.path,
  nodedotjs: siNodedotjs.path,
  notion: siNotion.path,
  npm: siNpm.path,
  nvidia: siNvidia.path,
  obsidian: siObsidian.path,
  obsstudio: siObsstudio.path,
  openjdk: siOpenjdk.path,
  php: siPhp.path,
  postgresql: siPostgresql.path,
  producthunt: siProducthunt.path,
  prometheus: siPrometheus.path,
  protonmail: siProtonmail.path,
  pubmed: siPubmed.path,
  python: siPython.path,
  raspberrypi: siRaspberrypi.path,
  react: siReact.path,
  reddit: siReddit.path,
  redis: siRedis.path,
  rust: siRust.path,
  sass: siSass.path,
  soundcloud: siSoundcloud.path,
  sourceforge: siSourceforge.path,
  spotify: siSpotify.path,
  stackoverflow: siStackoverflow.path,
  steam: siSteam.path,
  tailwindcss: siTailwindcss.path,
  taobao: siTaobao.path,
  telegram: siTelegram.path,
  terraform: siTerraform.path,
  tiktok: siTiktok.path,
  todoist: siTodoist.path,
  trello: siTrello.path,
  twitch: siTwitch.path,
  typescript: siTypescript.path,
  ubuntu: siUbuntu.path,
  unity: siUnity.path,
  unrealengine: siUnrealengine.path,
  vercel: siVercel.path,
  vite: siVite.path,
  vuedotjs: siVuedotjs.path,
  vultr: siVultr.path,
  wechat: siWechat.path,
  whatsapp: siWhatsapp.path,
  wordpress: siWordpress.path,
  x: siX.path,
  xiaohongshu: siXiaohongshu.path,
  ycombinator: siYcombinator.path,
  youtube: siYoutube.path,
  zhihu: siZhihu.path,
  zoom: siZoom.path
}

const DOMAINS: Record<string, string> = {
  'github.com': 'github',
  'gist.github.com': 'github',
  'bilibili.com': 'bilibili',
  'youtube.com': 'youtube',
  'youtu.be': 'youtube',
  'x.com': 'x',
  'twitter.com': 'x',
  'telegram.org': 'telegram',
  't.me': 'telegram',
  'discord.com': 'discord',
  'discord.gg': 'discord',
  'reddit.com': 'reddit',
  'steampowered.com': 'steam',
  'steamcommunity.com': 'steam',
  'figma.com': 'figma',
  'stackoverflow.com': 'stackoverflow',
  'npmjs.com': 'npm',
  'docker.com': 'docker',
  'python.org': 'python',
  'rust-lang.org': 'rust',
  'go.dev': 'go',
  'golang.org': 'go',
  'openjdk.org': 'openjdk',
  'react.dev': 'react',
  'vuejs.org': 'vuedotjs',
  'vitejs.dev': 'vite',
  'nodejs.org': 'nodedotjs',
  'linux.org': 'linux',
  'ubuntu.com': 'ubuntu',
  'apple.com': 'apple',
  'android.com': 'android',
  'google.com': 'google',
  'netflix.com': 'netflix',
  'spotify.com': 'spotify',
  'soundcloud.com': 'soundcloud',
  'twitch.tv': 'twitch',
  'tiktok.com': 'tiktok',
  'instagram.com': 'instagram',
  'facebook.com': 'facebook',
  'wa.me': 'whatsapp',
  'medium.com': 'medium',
  'dev.to': 'devdotto',
  'news.ycombinator.com': 'ycombinator',
  'producthunt.com': 'producthunt',
  'dribbble.com': 'dribbble',
  'behance.net': 'behance',
  'music.163.com': 'neteasecloudmusic',
  'douban.com': 'douban',
  'xiaohongshu.com': 'xiaohongshu',
  'alipay.com': 'alipay',
  'taobao.com': 'taobao',
  'meituan.com': 'meituan',
  'dropbox.com': 'dropbox',
  'cloud.google.com': 'googlecloud',
  'vercel.com': 'vercel',
  'netlify.com': 'netlify',
  'cloudflare.com': 'cloudflare',
  'gitlab.com': 'gitlab',
  'bitbucket.org': 'bitbucket',
  'sourceforge.net': 'sourceforge',
  'gmail.com': 'gmail',
  'proton.me': 'protonmail',
  'zoom.us': 'zoom',
  'trello.com': 'trello',
  'asana.com': 'asana',
  'jira.com': 'jira',
  'atlassian.com': 'jira',
  'confluence.com': 'confluence',
  'wordpress.com': 'wordpress',
  'wordpress.org': 'wordpress',
  'ghost.org': 'ghost',
  'hexo.io': 'hexo',
  'gohugo.io': 'hugo',
  'djangoproject.com': 'django',
  'flask.palletsprojects.com': 'flask',
  'laravel.com': 'laravel',
  'php.net': 'php',
  'javascript.com': 'javascript',
  'typescriptlang.org': 'typescript',
  'html5.com': 'html5',
  'sass-lang.com': 'sass',
  'tailwindcss.com': 'tailwindcss',
  'mongodb.com': 'mongodb',
  'mysql.com': 'mysql',
  'postgresql.org': 'postgresql',
  'redis.io': 'redis',
  'nginx.org': 'nginx',
  'apache.org': 'apache',
  'grafana.com': 'grafana',
  'prometheus.io': 'prometheus',
  'jenkins.io': 'jenkins',
  'ansible.com': 'ansible',
  'kubernetes.io': 'kubernetes',
  'terraform.io': 'terraform',
  'digitalocean.com': 'digitalocean',
  'vultr.com': 'vultr',
  'intel.com': 'intel',
  'amd.com': 'amd',
  'nvidia.com': 'nvidia',
  'raspberrypi.com': 'raspberrypi',
  'arduino.cc': 'arduino',
  'unity.com': 'unity',
  'unrealengine.com': 'unrealengine',
  'blender.org': 'blender',
  'obsproject.com': 'obsstudio',
  'audacityteam.org': 'audacity',
  'gimp.org': 'gimp',
  'inkscape.org': 'inkscape',
  'obsidian.md': 'obsidian',
  'evernote.com': 'evernote',
  'todoist.com': 'todoist',
  'calendar.google.com': 'googlecalendar',
  'docs.google.com': 'googledocs',
  'sheets.google.com': 'googlesheets',
  'arxiv.org': 'arxiv',
  'ieee.org': 'ieee',
  'acm.org': 'acm',
  'pubmed.ncbi.nlm.nih.gov': 'pubmed',
  'zhihu.com': 'zhihu',
  'gitee.com': 'gitee',
  'notion.so': 'notion',
  'drive.google.com': 'googledrive',
  'baidu.com': 'baidu',
  'weixin.qq.com': 'wechat'
}

const TEXTS: Record<string, { t: string; c: string }> = {
  'weibo.com': { t: '微', c: '#E6162D' },
  'qq.com': { t: 'Q', c: '#12B7F5' },
  'kuaishou.com': { t: '快', c: '#FF5000' },
  'pan.baidu.com': { t: '盘', c: '#2932E1' },
  'pan.quark.cn': { t: '夸', c: '#6C4CF1' },
  '123pan.com': { t: '123', c: '#2B6EF3' },
  '123684.com': { t: '123', c: '#2B6EF3' },
  '123865.com': { t: '123', c: '#2B6EF3' },
  'lanzou.com': { t: '蓝', c: '#2A7FFF' },
  'lanzoui.com': { t: '蓝', c: '#2A7FFF' },
  'thunder.com': { t: '迅', c: '#2A6BFF' },
  'jd.com': { t: '京', c: '#E1251B' },
  'pinduoduo.com': { t: '拼', c: '#E22E1F' },
  'toutiao.com': { t: '头', c: '#F04142' },
  'huya.com': { t: '虎', c: '#F5A623' },
  'douyu.com': { t: '斗', c: '#FF7D00' },
  'y.qq.com': { t: 'Q', c: '#31C27C' },
  'aliyundrive.com': { t: '阿', c: '#5B4CF0' },
  'alipan.com': { t: '阿', c: '#5B4CF0' },
  '115.com': { t: '115', c: '#3B7CFF' },
  'b2b168.com': { t: 'B', c: '#1E88E5' }
}

const GLOBE =
  'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 0c2.5 2.4 4 5.6 4 10s-1.5 7.6-4 10m0-20c-2.5 2.4-4 5.6-4 10s1.5 7.6 4 10M2.5 9h19M2.5 15h19'

export function siteInfo(url: string): { html: string; color: string; label: string } {
  let host = ''
  try {
    host = new URL(url).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return { html: svg(GLOBE), color: '#8A8378', label: '' }
  }
  for (const key of Object.keys(DOMAINS)) {
    if (host === key || host.endsWith('.' + key)) {
      const slug = DOMAINS[key]
      return { html: svg(ICONS[slug]), color: '#3E5C4B', label: slug }
    }
  }
  for (const key of Object.keys(TEXTS)) {
    if (host === key || host.endsWith('.' + key)) {
      const t = TEXTS[key]
      return {
        html: `<span class="lnk-txt" style="background:${t.c}">${t.t}</span>`,
        color: t.c,
        label: t.t,
      }
    }
  }
  return { html: svg(GLOBE), color: '#8A8378', label: '' }
}

export function svg(path: string, size = 14): string {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true"><path d="${path}"/></svg>`
}

export function decorateHtml(html: string): string {
  if (!html || !/<a\s/i.test(html)) return html
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    doc.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href') || ''
      if (!/^https?:/i.test(href)) return
      const info = siteInfo(href)
      const ico = doc.createElement('span')
      ico.className = 'lnk-ico'
      ico.style.color = info.color
      ico.innerHTML = info.html
      a.classList.add('lnk')
      a.insertAdjacentElement('beforebegin', ico)
    })
    return doc.body.innerHTML
  } catch {
    return html
  }
}

export function patchLinks(root: HTMLElement) {}
