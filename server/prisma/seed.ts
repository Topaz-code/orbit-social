import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Checking Orbit database...');

  const userCount = await prisma.user.count();
  if (userCount > 0) {
    console.log(`ℹ️ Database already contains ${userCount} users. Ensuring admin and moderator roles are assigned...`);
    const alex = await prisma.user.findFirst({
      where: { OR: [{ username: 'alexchen' }, { email: 'alex@orbit.local' }] },
    });
    if (alex) {
      await prisma.user.update({
        where: { id: alex.id },
        data: { role: 'ADMIN' },
      });
      console.log(`🛡️ Verified admin role for ${alex.username} (${alex.email}).`);
    }
    const sarah = await prisma.user.findFirst({
      where: { OR: [{ username: 'sarahj' }, { email: 'sarah@orbit.local' }] },
    });
    if (sarah) {
      await prisma.user.update({
        where: { id: sarah.id },
        data: { role: 'MODERATOR' },
      });
      console.log(`🛡️ Verified moderator role for ${sarah.username} (${sarah.email}).`);
    }
    return;
  }

  console.log('🌱 Starting initial database seed...');

  // 2. Hash shared demo password
  const password_hash = await bcrypt.hash('orbit123', 10);
  const security_answer_hash = await bcrypt.hash('shadow', 10);

  // 3. Create 8 Demo Users
  const usersData = [
    {
      username: 'alexchen',
      role: 'ADMIN',
      display_name: 'Alex Chen',
      email: 'alex@orbit.local',
      phone: '+1555101001',
      bio: 'Photography enthusiast 📸 | Coffee addict ☕ | Exploring the world one frame at a time',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      cover_url: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1200&auto=format&fit=crop&q=80',
      is_online: true,
    },
    {
      username: 'sarahj',
      role: 'MODERATOR',
      display_name: 'Sarah Johnson',
      email: 'sarah@orbit.local',
      phone: '+1555101002',
      bio: 'Reading, coding, and hiking 🏔️ | CS Major @ State Univ | Open source advocate',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
      cover_url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&auto=format&fit=crop&q=80',
      is_online: true,
    },
    {
      username: 'mikeross',
      display_name: 'Mike Ross',
      email: 'mike@orbit.local',
      phone: '+1555101003',
      bio: 'Law student by day, gamer by night 🎮 | Chess enthusiast ♟️',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      cover_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&auto=format&fit=crop&q=80',
      is_online: false,
    },
    {
      username: 'emilyw',
      display_name: 'Emily Williams',
      email: 'emily@orbit.local',
      phone: '+1555101004',
      bio: 'Artist & designer | Creating beauty daily 🎨 | Digital illustration & pottery',
      avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&auto=format&fit=crop&q=80',
      cover_url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop&q=80',
      is_online: true,
    },
    {
      username: 'jasonk',
      display_name: 'Jason Kumar',
      email: 'jason@orbit.local',
      phone: '+1555101005',
      bio: 'Startup founder | Building cool things 🚀 | Teen privacy enthusiast',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
      cover_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80',
      is_online: true,
    },
    {
      username: 'lisapark',
      display_name: 'Lisa Park',
      email: 'lisa@orbit.local',
      phone: '+1555101006',
      bio: 'Music is life 🎵 | Piano & acoustic guitar | Songwriter & indie vibe lover',
      avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
      cover_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80',
      is_online: false,
    },
    {
      username: 'davidm',
      display_name: 'David Martinez',
      email: 'david@orbit.local',
      phone: '+1555101007',
      bio: 'Sports fanatic ⚽ | Gym rat 💪 | Track & Field sprint coach',
      avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
      cover_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1200&auto=format&fit=crop&q=80',
      is_online: true,
    },
    {
      username: 'rachelg',
      display_name: 'Rachel Green',
      email: 'rachel@orbit.local',
      phone: '+1555101008',
      bio: 'Fashion, food, and fun ✨ | Baking sourdough | Vintage thrift queen',
      avatar_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80',
      cover_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&auto=format&fit=crop&q=80',
      is_online: false,
    },
  ];

  const createdUsers: Record<string, any> = {};

  for (const u of usersData) {
    const user = await prisma.user.create({
      data: {
        ...u,
        password_hash,
        security_question: "What is your pet's name?",
        security_answer_hash,
        privacy_settings: JSON.stringify({
          posts: 'everyone',
          messages: 'everyone',
          phone: 'friends',
          onlineStatus: 'everyone',
          stories: 'everyone',
        }),
      },
    });
    createdUsers[u.username] = user;
  }

  console.log('👥 Created 8 demo users.');

  // 4. Create Friendships Graph
  const friendshipsList = [
    ['alexchen', 'sarahj'],
    ['alexchen', 'emilyw'],
    ['alexchen', 'jasonk'],
    ['alexchen', 'davidm'],
    ['sarahj', 'mikeross'],
    ['sarahj', 'lisapark'],
    ['emilyw', 'rachelg'],
    ['jasonk', 'davidm'],
    ['lisapark', 'rachelg'],
    ['mikeross', 'davidm'],
  ];

  for (const [u1, u2] of friendshipsList) {
    await prisma.friendship.create({
      data: {
        requester_id: createdUsers[u1].id,
        addressee_id: createdUsers[u2].id,
        status: 'accepted',
      },
    });
  }

  // Pending request for Alex from Rachel
  await prisma.friendship.create({
    data: {
      requester_id: createdUsers['rachelg'].id,
      addressee_id: createdUsers['alexchen'].id,
      status: 'pending',
    },
  });

  console.log('🤝 Created friendships social graph.');

  // 5. Create Demo Groups (Max 10 members)
  const photographyGroup = await prisma.group.create({
    data: {
      name: 'Photography Club',
      description: 'A cozy corner for lens lovers, street photographers, and darkroom nerds 📷✨',
      avatar_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&auto=format&fit=crop&q=80',
      cover_url: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=1200&auto=format&fit=crop&q=80',
      created_by: createdUsers['alexchen'].id,
      privacy: 'public',
      max_members: 10,
      members: {
        create: [
          { user_id: createdUsers['alexchen'].id, role: 'admin' },
          { user_id: createdUsers['sarahj'].id, role: 'moderator' },
          { user_id: createdUsers['emilyw'].id, role: 'member' },
          { user_id: createdUsers['davidm'].id, role: 'member' },
          { user_id: createdUsers['rachelg'].id, role: 'member' },
        ],
      },
    },
  });

  const studyGroup = await prisma.group.create({
    data: {
      name: 'Study Group CS101',
      description: 'Data structures, algorithms, and late night debugging sessions 💻',
      avatar_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&auto=format&fit=crop&q=80',
      cover_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80',
      created_by: createdUsers['sarahj'].id,
      privacy: 'private',
      max_members: 10,
      members: {
        create: [
          { user_id: createdUsers['sarahj'].id, role: 'admin' },
          { user_id: createdUsers['mikeross'].id, role: 'member' },
          { user_id: createdUsers['jasonk'].id, role: 'member' },
          { user_id: createdUsers['alexchen'].id, role: 'member' },
        ],
      },
    },
  });

  const fitnessGroup = await prisma.group.create({
    data: {
      name: 'Fitness Challenge',
      description: 'Daily workouts, 10k steps, hydration reminders, and healthy recipes! 🏃‍♂️💪',
      avatar_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&auto=format&fit=crop&q=80',
      cover_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1200&auto=format&fit=crop&q=80',
      created_by: createdUsers['davidm'].id,
      privacy: 'public',
      max_members: 10,
      members: {
        create: [
          { user_id: createdUsers['davidm'].id, role: 'admin' },
          { user_id: createdUsers['alexchen'].id, role: 'member' },
          { user_id: createdUsers['sarahj'].id, role: 'member' },
          { user_id: createdUsers['jasonk'].id, role: 'member' },
          { user_id: createdUsers['rachelg'].id, role: 'member' },
          { user_id: createdUsers['emilyw'].id, role: 'member' },
        ],
      },
    },
  });

  console.log('🏷️ Created 3 demo groups with member limits.');

  // 6. Create Demo Posts (~18 posts with varied rich media, links, multiple images)
  const postsData = [
    {
      username: 'alexchen',
      content_text: 'Golden hour in the mountains! Caught this misty sunrise during our hike this morning. No filters, just raw early light. 🌄✨ #Photography #Nature',
      media_url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1000&auto=format&fit=crop&q=80',
      media_type: 'image',
      created_at: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
    },
    {
      username: 'sarahj',
      content_text: 'Finally finished my compiler project for CS class! 🚀 Spent 3 days tracking down a single off-by-one pointer error. Check out this guide on AST parsing if you are diving into language design:',
      link_url: 'https://en.wikipedia.org/wiki/Abstract_syntax_tree',
      link_preview: JSON.stringify({
        url: 'https://en.wikipedia.org/wiki/Abstract_syntax_tree',
        title: 'Abstract syntax tree - Wikipedia',
        description: 'In computer science, an abstract syntax tree (AST) is a tree representation of the abstract syntactic structure of source code.',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Abstract_syntax_tree_for_Euclidean_algorithm.svg/1200px-Abstract_syntax_tree_for_Euclidean_algorithm.svg.png',
        domain: 'wikipedia.org',
      }),
      created_at: new Date(Date.now() - 1000 * 60 * 90), // 1.5h ago
    },
    {
      username: 'emilyw',
      content_text: 'Studio updates! Working on a brand new series of watercolor ceramic plates. Which color palette do you guys like better: earthy ochre or oceanic cyan? 🎨🥣',
      media_url: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=1000&auto=format&fit=crop&q=80',
      media_type: 'image',
      media_gallery: JSON.stringify([
        'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=1000&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=1000&auto=format&fit=crop&q=80',
      ]),
      created_at: new Date(Date.now() - 1000 * 60 * 180), // 3h ago
    },
    {
      username: 'jasonk',
      content_text: 'Why algorithmic feeds harm genuine social connection:\n1. They maximize outrage to keep eyeballs\n2. They hide 90% of your real friends updates\n3. They commercialize your private habits\n\nOrbit is strictly chronological. The simplest ideas are often the most liberating. 🪐 #PrivacyFirst #NoAlgorithm',
      created_at: new Date(Date.now() - 1000 * 60 * 240), // 4h ago
    },
    {
      username: 'davidm',
      content_text: 'New personal best on 5K sprint today: 18:42! 🏃‍♂️💨 Hydration and pacing were key. Who is down for the weekend group run at the park?',
      media_url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1000&auto=format&fit=crop&q=80',
      media_type: 'image',
      created_at: new Date(Date.now() - 1000 * 60 * 360), // 6h ago
    },
    {
      username: 'lisapark',
      content_text: 'Late night acoustic session 🎸 Just recorded a rough acoustic demo of my new song "Orbiting You". Writing lyrics about self-discovery and finding peace without notification anxiety.',
      media_url: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=1000&auto=format&fit=crop&q=80',
      media_type: 'image',
      created_at: new Date(Date.now() - 1000 * 60 * 480), // 8h ago
    },
    {
      username: 'rachelg',
      content_text: 'Found this incredible 1980s oversized denim jacket at the downtown vintage market today! Total steal for $15 ✨ Look at the embroidery on the back:',
      media_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=1000&auto=format&fit=crop&q=80',
      media_type: 'image',
      created_at: new Date(Date.now() - 1000 * 60 * 600), // 10h ago
    },
    {
      username: 'mikeross',
      content_text: 'Game night highlights: pulled off a bishop sacrifice into checkmate in 22 moves against Stockfish Level 6! ♟️ Any chess players here on Orbit? Drop your usernames!',
      created_at: new Date(Date.now() - 1000 * 60 * 720), // 12h ago
    },
    {
      username: 'alexchen',
      content_text: 'Testing out the 35mm f/1.4 prime lens on rainy street reflections. The bokeh and chromatic fidelity are so dreamy 📸🌧️',
      media_url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1000&auto=format&fit=crop&q=80',
      media_type: 'image',
      group_id: photographyGroup.id,
      created_at: new Date(Date.now() - 1000 * 60 * 800), // 13h ago
    },
    {
      username: 'sarahj',
      content_text: 'Reminder for CS101 study group: we are meeting in Discord / Orbit voice room tomorrow at 4 PM to review dynamic programming algorithms!',
      group_id: studyGroup.id,
      created_at: new Date(Date.now() - 1000 * 60 * 950), // 15h ago
    },
    {
      username: 'davidm',
      content_text: 'Weekend group workout reminder! 30 min HIIT + 15 min core stretches. Let us crush our weekly goals together! 💪',
      group_id: fitnessGroup.id,
      created_at: new Date(Date.now() - 1000 * 60 * 1100), // 18h ago
    },
    {
      username: 'emilyw',
      content_text: 'Sunday sketch dump ✍️ Exploring botanical patterns and geometric symmetry. Sometimes pen and paper beats any tablet screen.',
      media_url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1000&auto=format&fit=crop&q=80',
      media_type: 'image',
      created_at: new Date(Date.now() - 1000 * 60 * 1300), // 21h ago
    },
  ];

  const createdPosts: any[] = [];

  for (const p of postsData) {
    const post = await prisma.post.create({
      data: {
        user_id: createdUsers[p.username].id,
        content_text: p.content_text,
        media_url: p.media_url || '',
        media_type: p.media_type || '',
        media_gallery: p.media_gallery || '[]',
        link_url: p.link_url || '',
        link_preview: p.link_preview || '{}',
        group_id: p.group_id || null,
        visibility: 'public',
        created_at: p.created_at,
        likes_count: 0,
        comments_count: 0,
      },
    });
    createdPosts.push(post);
  }

  console.log(`📝 Created ${createdPosts.length} demo posts.`);

  // 7. Seed Comments and Likes for Posts
  const demoComments = [
    {
      postIndex: 0,
      comments: [
        { user: 'sarahj', text: 'This lighting is unbelievable Alex! What lens was this?' },
        { user: 'emilyw', text: 'The depth in this composition is perfection 😍' },
        { user: 'alexchen', text: '@sarahj 24-70mm f/2.8 GM at 35mm! Woke up at 5:15am for this shot.' },
      ],
    },
    {
      postIndex: 1,
      comments: [
        { user: 'mikeross', text: 'Congrats Sarah! Compilers is no joke 👏' },
        { user: 'jasonk', text: 'ASTs are so satisfying once the recursion clicks.' },
      ],
    },
    {
      postIndex: 2,
      comments: [
        { user: 'rachelg', text: 'Definitely the oceanic cyan! It has so much warmth.' },
        { user: 'lisapark', text: 'Both look stunning, but cyan would match my room decor so well 💙' },
      ],
    },
    {
      postIndex: 3,
      comments: [
        { user: 'alexchen', text: '1000% agree. Seeing what my friends actually posted in order is refreshing.' },
        { user: 'davidm', text: 'No infinite casino scroll loops = more time to train!' },
      ],
    },
  ];

  for (const item of demoComments) {
    const post = createdPosts[item.postIndex];
    if (!post) continue;

    let parentId: string | null = null;
    let commentCount = 0;

    for (const c of item.comments) {
      const isReply = c.text.startsWith('@');
      const comment = await prisma.comment.create({
        data: {
          post_id: post.id,
          user_id: createdUsers[c.user].id,
          content: c.text,
          parent_comment_id: isReply ? parentId : null,
          created_at: new Date(Date.now() - 1000 * 60 * (10 + commentCount * 5)),
        },
      });
      if (!isReply) {
        parentId = comment.id;
      }
      commentCount++;
    }

    await prisma.post.update({
      where: { id: post.id },
      data: { comments_count: commentCount },
    });
  }

  // Add random likes
  const allUserKeys = Object.keys(createdUsers);
  for (const post of createdPosts) {
    const likers = allUserKeys
      .filter(() => Math.random() > 0.4)
      .slice(0, 5);

    for (const uKey of likers) {
      await prisma.like.create({
        data: {
          post_id: post.id,
          user_id: createdUsers[uKey].id,
        },
      }).catch(() => {});
    }

    const likeCount = await prisma.like.count({ where: { post_id: post.id } });
    await prisma.post.update({
      where: { id: post.id },
      data: { likes_count: likeCount },
    });
  }

  console.log('💬 Seeded comments and likes.');

  // 8. Seed Stories (Active for 24h)
  const storiesData = [
    {
      username: 'alexchen',
      media_url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
      caption: 'Early morning coffee & editing ☕📷',
      text_overlay: JSON.stringify({ text: '5:30 AM Vibes ✨', color: '#ffffff', position: 'top' }),
    },
    {
      username: 'sarahj',
      media_url: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&auto=format&fit=crop&q=80',
      caption: 'Finally fixed the bug! 🚀',
      text_overlay: JSON.stringify({ text: 'Compiles with 0 errors 🎉', color: '#22c55e', position: 'center' }),
    },
    {
      username: 'emilyw',
      media_url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80',
      caption: 'Fresh canvas ready 🎨',
      text_overlay: JSON.stringify({ text: 'Studio Day 🌸', color: '#f43f5e', position: 'bottom' }),
    },
    {
      username: 'davidm',
      media_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80',
      caption: 'Post workout shake 🥛💪',
      text_overlay: JSON.stringify({ text: 'Leg Day Done 🏋️', color: '#06b6d4', position: 'top' }),
    },
    {
      username: 'rachelg',
      media_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80',
      caption: 'Thrift shop treasure hunt 🛍️',
      text_overlay: JSON.stringify({ text: 'Vintage Finds 🧥', color: '#eab308', position: 'center' }),
    },
  ];

  for (const s of storiesData) {
    await prisma.story.create({
      data: {
        user_id: createdUsers[s.username].id,
        media_url: s.media_url,
        media_type: 'image',
        caption: s.caption,
        text_overlay: s.text_overlay,
        viewers: JSON.stringify([createdUsers['alexchen'].id]),
        expires_at: new Date(Date.now() + 23 * 60 * 60 * 1000), // Active for 23 more hours
      },
    });
  }

  console.log('📸 Seeded 5 active 24h stories.');

  // 9. Seed Direct & Group Chat Conversations
  // Conv 1: Alex & Sarah
  const convAlexSarah = await prisma.conversation.create({
    data: {
      type: 'direct',
      created_by: createdUsers['alexchen'].id,
      max_members: 2,
      members: {
        create: [
          { user_id: createdUsers['alexchen'].id, role: 'admin' },
          { user_id: createdUsers['sarahj'].id, role: 'member' },
        ],
      },
    },
  });

  const alexSarahMessages = [
    { sender: 'sarahj', text: 'Hey Alex! Loved your sunrise photo from this morning! 🌄' },
    { sender: 'alexchen', text: 'Thanks Sarah! The fog at 5am was surreal.' },
    { sender: 'sarahj', text: 'Are we still on for the photography walk this Saturday?' },
    { sender: 'alexchen', text: 'Absolutely! Let us meet at the botanical garden gate at 9 AM.' },
    { sender: 'sarahj', text: 'Perfect! I will bring my 50mm lens.' },
  ];

  for (const m of alexSarahMessages) {
    await prisma.message.create({
      data: {
        conversation_id: convAlexSarah.id,
        sender_id: createdUsers[m.sender].id,
        content: m.text,
        media_type: 'text',
        is_read: true,
      },
    });
  }

  // Conv 2: Alex & Emily
  const convAlexEmily = await prisma.conversation.create({
    data: {
      type: 'direct',
      created_by: createdUsers['emilyw'].id,
      max_members: 2,
      members: {
        create: [
          { user_id: createdUsers['emilyw'].id, role: 'admin' },
          { user_id: createdUsers['alexchen'].id, role: 'member' },
        ],
      },
    },
  });

  const alexEmilyMessages = [
    { sender: 'emilyw', text: 'Hey Alex! Would you mind taking a few high-res photos of my new pottery collection next week?' },
    { sender: 'alexchen', text: 'I would love to Emily! Your ceramic plates look amazing.' },
    { sender: 'emilyw', text: 'Thank you! I will have 6 pieces ready by Wednesday.' },
  ];

  for (const m of alexEmilyMessages) {
    await prisma.message.create({
      data: {
        conversation_id: convAlexEmily.id,
        sender_id: createdUsers[m.sender].id,
        content: m.text,
        media_type: 'text',
        is_read: false,
      },
    });
  }

  // Conv 3: Photography Club Group Chat
  const convPhotoClub = await prisma.conversation.create({
    data: {
      type: 'group',
      name: 'Photography Club Chat',
      avatar_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&auto=format&fit=crop&q=80',
      created_by: createdUsers['alexchen'].id,
      group_id: photographyGroup.id,
      max_members: 10,
      members: {
        create: [
          { user_id: createdUsers['alexchen'].id, role: 'admin' },
          { user_id: createdUsers['sarahj'].id, role: 'moderator' },
          { user_id: createdUsers['emilyw'].id, role: 'member' },
          { user_id: createdUsers['davidm'].id, role: 'member' },
          { user_id: createdUsers['rachelg'].id, role: 'member' },
        ],
      },
    },
  });

  const photoClubMessages = [
    { sender: 'alexchen', text: 'Welcome everyone to the official Photography Club chat! 📸' },
    { sender: 'davidm', text: 'Stoked to be here! Looking forward to learning some camera basics.' },
    { sender: 'rachelg', text: 'Can someone recommend a good compact travel camera for street shots?' },
    { sender: 'alexchen', text: 'Check out the Ricoh GR III or Fujifilm X100V. Super portable and amazing sensors!' },
  ];

  for (const m of photoClubMessages) {
    await prisma.message.create({
      data: {
        conversation_id: convPhotoClub.id,
        sender_id: createdUsers[m.sender].id,
        content: m.text,
        media_type: 'text',
        is_read: true,
      },
    });
  }

  console.log('💬 Seeded direct and group chat conversations.');

  // 10. Seed Call History
  await prisma.call.create({
    data: {
      caller_id: createdUsers['sarahj'].id,
      receiver_id: createdUsers['alexchen'].id,
      type: 'voice',
      status: 'completed',
      started_at: new Date(Date.now() - 1000 * 60 * 120),
      ended_at: new Date(Date.now() - 1000 * 60 * 110),
      duration: 612, // ~10 minutes
    },
  });

  await prisma.call.create({
    data: {
      caller_id: createdUsers['davidm'].id,
      receiver_id: createdUsers['alexchen'].id,
      type: 'video',
      status: 'missed',
      started_at: new Date(Date.now() - 1000 * 60 * 300),
      duration: 0,
    },
  });

  console.log('📞 Seeded call history.');

  // 11. Seed Unread Notifications for Alex Chen
  const alexId = createdUsers['alexchen'].id;
  const notificationsData = [
    {
      type: 'friend_request',
      reference_id: createdUsers['rachelg'].id,
      reference_type: 'user',
      content: 'Rachel Green sent you a friend request.',
      created_at: new Date(Date.now() - 1000 * 60 * 20),
    },
    {
      type: 'post_like',
      reference_id: createdPosts[0].id,
      reference_type: 'post',
      content: 'Sarah Johnson liked your sunrise photo.',
      created_at: new Date(Date.now() - 1000 * 60 * 25),
    },
    {
      type: 'post_comment',
      reference_id: createdPosts[0].id,
      reference_type: 'post',
      content: 'Emily Williams commented: "The depth in this composition is perfection 😍"',
      created_at: new Date(Date.now() - 1000 * 60 * 28),
    },
    {
      type: 'new_message',
      reference_id: convAlexEmily.id,
      reference_type: 'conversation',
      content: 'Emily Williams sent you a message.',
      created_at: new Date(Date.now() - 1000 * 60 * 35),
    },
    {
      type: 'missed_call',
      reference_id: createdUsers['davidm'].id,
      reference_type: 'call',
      content: 'Missed video call from David Martinez.',
      created_at: new Date(Date.now() - 1000 * 60 * 300),
    },
    {
      type: 'group_invite',
      reference_id: fitnessGroup.id,
      reference_type: 'group',
      content: 'David Martinez added you to Fitness Challenge.',
      created_at: new Date(Date.now() - 1000 * 60 * 500),
    },
  ];

  for (const n of notificationsData) {
    await prisma.notification.create({
      data: {
        user_id: alexId,
        type: n.type,
        reference_id: n.reference_id,
        reference_type: n.reference_type,
        content: n.content,
        is_read: false,
        created_at: n.created_at,
      },
    });
  }

  console.log('🔔 Seeded notifications for demo user Alex Chen.');
  console.log('✨ Seed completed successfully! All demo users have password: "orbit123"');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
