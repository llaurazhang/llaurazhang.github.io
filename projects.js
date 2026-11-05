// projects.js — edit this file to add / change your portfolio work!
//
// each folder (projects + hardware) is a list of "files". every file opens a case study.
//
// fields:
//   id        unique slug, no spaces
//   title     project name
//   file      the fake filename shown in the folder (e.g. "bloom.fig")
//   summary   one-liner shown on the card + top of the case study
//   cover     path to an image (e.g. "img/projects/bloom-cover.png") — leave "" to use the colour + emoji
//   color     background colour for the card when there's no cover
//   emoji     little icon on the card when there's no cover
//   tags      short labels
//   meta      { role, timeline, tools, team } — any can be left out
//   figma     a figma prototype / file share link → embedded right in the window (leave "" to hide)
//   links     [{ label, url }] — extra buttons (behance, github, video, etc.)
//   sections  [{ heading, body, image }] — the case study. body can include simple html (<b>, <a>, <br>)
//   gallery   ["img/...", "img/..."] — extra images shown at the end

window.PORTFOLIO = {
  projects: [
    {
      id: 'project-one',
      title: 'project one',
      file: 'project-one.fig',
      summary: 'a mobile app redesign — replace this with a one-line summary of the problem you solved.',
      cover: '',
      color: '#FFD6E0',
      emoji: '📱',
      tags: ['mobile', 'ux research', 'prototyping'],
      meta: { role: 'ui/ux designer', timeline: '6 weeks', tools: 'figma, figjam', team: 'solo' },
      figma: '',
      links: [],
      sections: [
        { heading: 'the problem', body: 'what was broken or missing? who was affected? keep it to 2–3 sentences.' },
        { heading: 'research', body: 'interviews, surveys, competitor analysis — what did you learn? a key quote or stat goes a long way.' },
        { heading: 'ideation', body: 'sketches, user flows, wireframes. show how your thinking evolved.' },
        { heading: 'final design', body: 'hi-fi screens + the prototype. paste your figma link into the <b>figma</b> field above and it will embed here!' },
        { heading: 'reflection', body: 'what would you do differently? what did testing reveal?' },
      ],
      gallery: [],
    },
    {
      id: 'project-two',
      title: 'project two',
      file: 'project-two.fig',
      summary: 'a web dashboard — replace this with a one-line summary.',
      cover: '',
      color: '#D8ECFF',
      emoji: '🖥️',
      tags: ['web', 'design system'],
      meta: { role: 'product designer', timeline: '1 term', tools: 'figma', team: '4 people' },
      figma: '',
      links: [],
      sections: [
        { heading: 'overview', body: 'what is this project and why does it matter?' },
        { heading: 'process', body: 'walk through your design process step by step.' },
        { heading: 'outcome', body: 'results, feedback, metrics, or what shipped.' },
      ],
      gallery: [],
    },
    {
      id: 'project-three',
      title: 'project three',
      file: 'project-three.fig',
      summary: 'a hackathon / devsoc project — replace this with a one-line summary.',
      cover: '',
      color: '#FFF1C9',
      emoji: '🍪',
      tags: ['hackathon', 'branding'],
      meta: { role: 'designer', timeline: '48 hours', tools: 'figma, illustrator' },
      figma: '',
      links: [],
      sections: [
        { heading: 'overview', body: 'what is this project and why does it matter?' },
        { heading: 'process', body: 'walk through your design process step by step.' },
        { heading: 'outcome', body: 'results, feedback, metrics, or what shipped.' },
      ],
      gallery: [],
    },
  ],

  hardware: [
    {
      id: 'hardware-one',
      title: 'prototype one',
      file: 'prototype-one.cad',
      summary: 'a physical prototype — replace this with what it does and who it is for.',
      cover: '',
      color: '#DFF5E1',
      emoji: '🔌',
      tags: ['arduino', 'physical computing'],
      meta: { role: 'design + build', timeline: '4 weeks', tools: 'arduino, c, 3d printing' },
      figma: '',
      links: [],
      sections: [
        { heading: 'concept', body: 'the idea and the interaction you wanted to create.' },
        { heading: 'build', body: 'components, wiring, enclosure, code. photos of the messy in-between stages are great here!' },
        { heading: 'testing', body: 'how people used it and what you changed.' },
      ],
      gallery: [],
    },
    {
      id: 'hardware-two',
      title: 'prototype two',
      file: 'prototype-two.cad',
      summary: 'a wearable / tangible interface — replace this with a one-line summary.',
      cover: '',
      color: '#EDE3FF',
      emoji: '⌚',
      tags: ['wearable', 'sensors'],
      meta: { role: 'designer', timeline: '1 term', tools: 'esp32, fusion 360' },
      figma: '',
      links: [],
      sections: [
        { heading: 'concept', body: 'the idea and the interaction you wanted to create.' },
        { heading: 'build', body: 'components, wiring, enclosure, code.' },
        { heading: 'reflection', body: 'what worked, what didn\'t, what is next.' },
      ],
      gallery: [],
    },
  ],
};
