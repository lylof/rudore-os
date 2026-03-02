import { z } from 'zod';
import { Member } from '@/types';

// ==========================================
// ZOD SCHEMAS FOR STRICT DATABASE VALIDATION
// ==========================================

const dbWalletSchema = z.object({
    totalPoints: z.number().default(0),
    currentMonthPoints: z.number().default(0),
    equityValue: z.number().default(0)
}).default({ totalPoints: 0, currentMonthPoints: 0, equityValue: 0 });

const dbMemberSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    password_hash: z.string().nullable().optional(), // Accepted from DB but never mapped to frontend
    role: z.string().default(''),
    department: z.any(), // Keeping as any or enum depending on setup
    avatar_initials: z.string().default(''),
    level: z.any(),
    skills: z.array(z.object({ name: z.string(), level: z.number() })).default([]),
    availability: z.number().default(0),
    wallet: dbWalletSchema,
    is_lead: z.boolean().default(false),
    is_admin: z.boolean().default(false),
    access_role_id: z.string().nullable().optional(),
    joined_at: z.string().or(z.date()).optional(),
    bio: z.string().nullable().optional(),
    academic_role: z.string().nullable().optional(),
    external_role: z.string().nullable().optional(),
    has_lpt: z.boolean().default(false),
    permissions: z.array(z.string()).default([])
});

const parseFloatSafe = (val: any) => {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
};

/**
 * Mappers to strictly convert DB snake_case objects to frontend valid camelCase DTOs.
 */
export function mapUserFromDB(dbUser: any): Member | null {
    if (!dbUser) return null;

    // Failsafe with zod (stripping out unexpected properties)
    const safeData = dbMemberSchema.parse(dbUser);

    // Convert joined_at safely to ISO String
    const joinedAtStr = safeData.joined_at
        ? (safeData.joined_at instanceof Date ? safeData.joined_at.toISOString() : safeData.joined_at)
        : new Date().toISOString();

    return {
        id: safeData.id,
        name: safeData.name,
        email: safeData.email,
        role: safeData.role,
        department: safeData.department,
        avatarInitials: safeData.avatar_initials,
        level: safeData.level,
        skills: safeData.skills as any, // Typecast to match the specific 1 | 2 | 3 | 4 | 5 level requirement
        availability: safeData.availability,
        wallet: safeData.wallet,
        isLead: safeData.is_lead,
        isAdmin: safeData.is_admin,
        accessRoleId: safeData.access_role_id || undefined,
        joinedAt: joinedAtStr,
        bio: safeData.bio || undefined,
        academicRole: safeData.academic_role || undefined,
        externalRole: safeData.external_role || undefined,
        hasLPT: safeData.has_lpt,
        permissions: safeData.permissions
    };
}

export function mapProjectFromDB(dbProject: any): any {
    if (!dbProject) return null;

    return {
        id: dbProject.id,
        name: dbProject.name,
        type: dbProject.type,
        status: dbProject.status,
        leadId: dbProject.lead_id,
        deadline: dbProject.deadline,
        description: dbProject.description,
        squadIds: dbProject.squad_ids || [],
        roadmap: dbProject.roadmap || [],
        financials: {
            budget: parseFloatSafe(dbProject.financial_budget),
            spent: parseFloatSafe(dbProject.financial_spent),
            revenue: parseFloatSafe(dbProject.financial_revenue),
            equityPool: parseFloatSafe(dbProject.equity_pool)
        }
    };
}

export function mapTaskFromDB(dbTask: any): any {
    if (!dbTask) return null;
    return {
        id: dbTask.id,
        title: dbTask.title,
        description: dbTask.description,
        projectId: dbTask.project_id,
        assigneeId: dbTask.assignee_id,
        status: dbTask.status,
        complexity: dbTask.complexity,
        qualityRating: dbTask.quality_rating,
        createdAt: dbTask.created_at,
        updatedAt: dbTask.updated_at,
        deadline: dbTask.deadline,
        tags: dbTask.tags || []
    };
}
