/**
 * prisma/seed.js — Resets DB and seeds fresh data
 * Run: node prisma/seed.js
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🗑️  Clearing all tables...');
    await prisma.submission.deleteMany();
    await prisma.practiceSet.deleteMany();
    await prisma.systemConfig.deleteMany();
    await prisma.package.deleteMany();
    await prisma.user.deleteMany();
    console.log('✅ Tables cleared.');

    // ── Create admin user ──────────────────────────────────────
    const adminPassword = await bcrypt.hash('Admin@123', 12);
    const admin = await prisma.user.create({
        data: {
            name: 'Administrator',
            email: 'admin@ielts.com',
            password: adminPassword,
            role: 'ADMIN',
            tier: 'PREMIUM',
        },
    });
    console.log(`👤 Admin created: ${admin.email} / Admin@123`);

    // ── Create demo user ───────────────────────────────────────
    const demoPassword = await bcrypt.hash('Demo@123', 12);
    const demo = await prisma.user.create({
        data: {
            name: 'Demo User',
            email: 'demo@ielts.com',
            password: demoPassword,
            role: 'USER',
            tier: 'FREE',
        },
    });
    console.log(`👤 Demo user created: ${demo.email} / Demo@123`);

    // ── Create Default Packages ─────────────────────────────────
    console.log('📦 Seeding default packages...');
    await prisma.package.createMany({
        data: [
            {
                code: 'FREE',
                name: 'Basic',
                price: 0,
                durationDays: null,
                description: 'Làm quen với bài thi và format.',
                benefits: JSON.stringify([
                    "Truy cập bộ đề Reading & Listening",
                    "Giới hạn 2 bài chấm AI / ngày",
                    "Community group"
                ]),
                isActive: true
            },
            {
                code: 'PRO',
                name: 'Pro',
                price: 199000,
                durationDays: 30,
                description: 'Bứt tốc điểm số siêu tốc trước kỳ thi.',
                benefits: JSON.stringify([
                    "Không giới hạn AI chấm Writing & Speaking",
                    "Phân tích chuyên sâu 4 tiêu chí",
                    "Đề cập nhật dự đoán quý mới nhất"
                ]),
                isActive: true
            },
            {
                code: 'PREMIUM',
                name: 'Premium',
                price: 499000,
                durationDays: 90,
                description: 'Gói đầu tư tiết kiệm và hiệu quả.',
                benefits: JSON.stringify([
                    "Mọi quyền lợi của gói Pro",
                    "Tiết kiệm 20% so với mua hàng tháng",
                    "Hỗ trợ riêng qua email"
                ]),
                isActive: true
            }
        ]
    });
    console.log('✅ Default packages seeded.');


    // ── System config defaults ─────────────────────────────────
    const configs = [
        { key: 'community_link', value: '' },
        { key: 'community_label', value: 'Tham gia nhóm học IELTS' },
        { key: 'daily_tip', value: 'Luyện tập mỗi ngày 30 phút để cải thiện band score nhanh nhất!' },
        { key: 'payment_stripe_pk', value: '' },
        { key: 'payment_stripe_sk', value: '' },
        { key: 'payment_webhook_secret', value: '' },
        { key: 'payment_pro_price_vnd', value: '199000' },
        { key: 'payment_premium_price_vnd', value: '349000' },
        { key: 'site_name', value: 'IELTS Mastery' },
    ];
    for (const c of configs) {
        await prisma.systemConfig.upsert({ where: { key: c.key }, update: {}, create: c });
    }
    console.log(`⚙️  System configs seeded.`);

    // ── Sample practice sets ───────────────────────────────────
    await prisma.practiceSet.createMany({
        data: [
            {
                skill: 'WRITING',
                title: 'Impact of AI on Employment',
                description: 'Task 2 - Discussion Essay',
                difficulty: 'Medium',
                isActive: true,
                content: JSON.stringify({
                    type: 'TASK2',
                    prompt: 'Some people believe that the development of artificial intelligence will lead to widespread unemployment. Others argue that AI will create more jobs than it displaces. Discuss both views and give your own opinion.',
                    tip: 'Write at least 250 words. Structure: Introduction → Body 1 → Body 2 → Your Opinion → Conclusion.',
                }),
            },
            {
                skill: 'WRITING',
                title: 'Online vs Traditional Education',
                description: 'Task 2 - Agree/Disagree',
                difficulty: 'Medium',
                isActive: true,
                content: JSON.stringify({
                    type: 'TASK2',
                    prompt: 'With the rise of online learning platforms, some people think traditional classroom education will become obsolete. To what extent do you agree or disagree?',
                    tip: 'Clearly state your position in the introduction.',
                }),
            },
            {
                skill: 'READING',
                title: 'The Rise of Urban Farming',
                description: 'Reading Passage 1',
                difficulty: 'Medium',
                isActive: true,
                content: JSON.stringify({
                    passage: `Urban farming has experienced remarkable growth in recent years, transforming cityscapes worldwide. From rooftop gardens in New York to vertical farms in Singapore, the movement represents a fundamental shift in how we think about food production.\n\nThe concept is not entirely new. During World War II, "victory gardens" were planted in urban areas across the United States and United Kingdom. However, modern urban farming employs sophisticated technologies including hydroponics, aquaponics, and aeroponics to maximize yields in limited spaces.\n\nHydroponics can produce up to 10 times more crops per square meter than traditional farming methods and uses approximately 90% less water. Research from Columbia University demonstrates that urban farms can reduce the "heat island effect," lowering building temperatures by up to 7 degrees Celsius.\n\nSocial benefits are equally significant. A 2019 study in The Lancet found that residents with access to community gardens reported 62% lower stress levels. Despite these benefits, critics argue that urban farming cannot replace rural agriculture at scale, as the total caloric output remains a fraction of traditional farming. The global vertical farming market is nonetheless projected to reach $12.77 billion by 2026.`,
                    questions: [
                        { id: 1, type: 'fill', text: 'During World War II, urban gardens were known as "_____ gardens".', answer: 'victory' },
                        { id: 2, type: 'fill', text: 'Hydroponic systems can produce up to _____ times more crops per square meter.', answer: '10' },
                        { id: 3, type: 'tf', text: 'Hydroponic systems use less water than traditional farming.', answer: 'TRUE' },
                        { id: 4, type: 'mcq', text: 'What effect can green rooftops reduce?', options: ['Water pollution', 'Heat island effect', 'Noise pollution', 'Air pollution'], answer: 'Heat island effect' },
                        { id: 5, type: 'fill', text: 'The global vertical farming market is projected to reach $_____ billion by 2026.', answer: '12.77' },
                    ],
                }),
            },
            {
                skill: 'SPEAKING',
                title: 'Technology — Part 1',
                description: 'Part 1 - Interview',
                difficulty: 'Easy',
                isActive: true,
                content: JSON.stringify({
                    part: 1,
                    topic: 'Technology',
                    questions: [
                        'How often do you use technology in your daily life?',
                        'What is your favourite app and why?',
                        'Do you think technology has improved people\'s lives?',
                        'What technology did you use when you were younger?',
                    ],
                }),
            },
            {
                skill: 'LISTENING',
                title: 'University Accommodation Office',
                description: 'Section 1 - Conversation',
                difficulty: 'Easy',
                isActive: true,
                content: JSON.stringify({
                    section: 1,
                    description: 'A conversation between a student and a housing officer about accommodation options.',
                    questions: [
                        { id: 1, type: 'fill', text: 'The student\'s last name is _____.', answer: 'morrison', hint: 'ONE WORD' },
                        { id: 2, type: 'fill', text: 'The monthly rent for the studio apartment is $_____.', answer: '850', hint: 'A NUMBER' },
                        { id: 3, type: 'mcq', text: 'Which type of accommodation does the student prefer?', options: ['Shared house', 'Studio apartment', 'Hall of residence', 'Home stay'], answer: 'Studio apartment' },
                        { id: 4, type: 'tf', text: 'The accommodation is available immediately.', answer: 'FALSE' },
                    ],
                }),
            },
        ],
    });
    console.log('📚 Practice sets seeded.');
    console.log('\n🎉 Seed completed!\n');
    console.log('  Admin: admin@ielts.com / Admin@123');
    console.log('  Demo:  demo@ielts.com  / Demo@123\n');
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
