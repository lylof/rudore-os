import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'db.json');
const JWT_SECRET = process.env.JWT_SECRET || 'rudore-secret-key-change-me';

const getUsers = () => {
    if (!fs.existsSync(DB_FILE)) return [];
    try {
        return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    } catch (e) {
        return [];
    }
};

const saveUsers = (users: any[]) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
};

export async function PUT(request: Request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const secretUint8 = new TextEncoder().encode(JWT_SECRET);
        const { payload } = await jwtVerify(token, secretUint8);
        const { name, role, academicRole, bio, skills, department, level } = await request.json();
        const users = getUsers();
        const userIndex = users.findIndex((u: any) => u.id === payload.id);

        if (userIndex === -1) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        const updatedUser = {
            ...users[userIndex],
            name: name || users[userIndex].name,
            role: role || users[userIndex].role,
            academicRole: academicRole || users[userIndex].academicRole,
            bio: bio || users[userIndex].bio,
            skills: skills || users[userIndex].skills,
            department: department || users[userIndex].department,
            level: level || users[userIndex].level,
            avatarInitials: (name || users[userIndex].name).substring(0, 2).toUpperCase()
        };

        users[userIndex] = updatedUser;
        saveUsers(users);

        return NextResponse.json({ user: { ...updatedUser, passwordHash: undefined } });
    } catch (error) {
        return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
}
