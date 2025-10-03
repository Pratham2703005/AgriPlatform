import { FarmAPI } from './farmApi';
import { GuestFarmStorage } from '../utils/guestFarmStorage';
import type { User } from '../types/user';

/**
 * Service for managing guest mode functionality
 */
export class GuestModeService {
  private static _migrating = false;

  /**
   * Create a guest user object
   */
  static createGuestUser(): User {
    return {
      id: 'guest',
      fullName: 'Guest User',
      email: 'guest@agriplatform.com',
      phone: '',
      address: '',
      role: 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Check if current session is in guest mode
   */
  static isGuestMode(): boolean {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('auth_user');

    // If no auth token but guest token exists, we're in guest mode
    const guestToken = localStorage.getItem('guest_mode');
    return !token && !user && guestToken === 'true';
  }

  /**
   * Enable guest mode
   */
  static enableGuestMode(): User {
    localStorage.setItem('guest_mode', 'true');
    const guestUser = this.createGuestUser();
    localStorage.setItem('guest_user', JSON.stringify(guestUser));
    return guestUser;
  }

  /**
   * Get guest user data
   */
  static getGuestUser(): User | null {
    try {
      const guestUserStr = localStorage.getItem('guest_user');
      return guestUserStr ? JSON.parse(guestUserStr) : null;
    } catch (error) {
      console.error('Error getting guest user:', error);
      return null;
    }
  }

  /**
   * Disable guest mode (cleanup)
   */
  static disableGuestMode(): void {
    localStorage.removeItem('guest_mode');
    localStorage.removeItem('guest_user');
  }

  /**
   * Migrate all guest farms to user account after signup/signin
   */
  static async migrateGuestFarmsToUser(): Promise<{
    success: boolean;
    migratedCount: number;
    errors: string[];
  }> {
    // Prevent multiple concurrent migrations
    if (this._migrating) {
      console.warn('Migration already in progress, skipping duplicate call');
      return { success: false, migratedCount: 0, errors: ['Migration already in progress'] };
    }

    this._migrating = true;
    
    try {
      const guestFarms = GuestFarmStorage.getAllForMigration();
      const errors: string[] = [];
      let migratedCount = 0;

      if (guestFarms.length === 0) {
        return { success: true, migratedCount: 0, errors: [] };
      }

      // Check if user already has farms to prevent duplication
      try {
        const existingFarms = await FarmAPI.getFarms(1, 1);
        if (existingFarms.code === 1 && existingFarms.result.farms.length > 0) {
          console.warn('User already has farms, skipping migration to prevent duplicates');
          // Still clear guest farms since user already has data
          GuestFarmStorage.clearAllFarms();
          this.disableGuestMode();
          return { success: true, migratedCount: 0, errors: ['User already has farms'] };
        }
      } catch (e) {
        console.log('Could not check existing farms, proceeding with migration');
      }

      console.log(`🔄 Starting migration of ${guestFarms.length} guest farms...`);

      // Migrate farms in parallel for better performance (max 3 concurrent)
      const BATCH_SIZE = 3;
      for (let i = 0; i < guestFarms.length; i += BATCH_SIZE) {
        const batch = guestFarms.slice(i, i + BATCH_SIZE);
        
        const batchPromises = batch.map(async (farmData) => {
          try {
            const createRequest = FarmAPI.transformToApiFormat(farmData);
            const response = await FarmAPI.createFarm(createRequest);

            if (response.code === 1) {
              console.log(`✅ Migrated farm: ${farmData.name}`);
              return { success: true, farmName: farmData.name };
            } else {
              const errorMsg = `Failed to migrate farm "${farmData.name}": ${response.message}`;
              console.error(`❌ ${errorMsg}`);
              return { success: false, error: errorMsg };
            }
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const errorMsg = `Failed to migrate farm "${farmData.name}": ${errorMessage}`;
            console.error(`❌ ${errorMsg}`);
            return { success: false, error: errorMsg };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        
        // Process batch results
        batchResults.forEach(result => {
          if (result.success) {
            migratedCount++;
          } else if (result.error) {
            errors.push(result.error);
          }
        });

        // Small delay between batches to prevent rate limiting
        if (i + BATCH_SIZE < guestFarms.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      const success = migratedCount > 0;

      if (success) {
        // Clear guest farms after successful migration
        GuestFarmStorage.clearAllFarms();
        // Disable guest mode
        this.disableGuestMode();
        console.log(
          `✅ Migration completed: ${migratedCount}/${guestFarms.length} farms migrated`
        );
      }

      return { success, migratedCount, errors };
    } finally {
      this._migrating = false;
    }
  }

  /**
   * Check if user should be automatically logged in as guest
   */
  static shouldAutoEnableGuest(): boolean {
    const hasAuthToken = !!localStorage.getItem('auth_token');
    const hasAuthUser = !!localStorage.getItem('auth_user');
    const hasGuestMode = !!localStorage.getItem('guest_mode');

    // Enable guest mode if no authentication and not already in guest mode
    return !hasAuthToken && !hasAuthUser && !hasGuestMode;
  }

  /**
   * Get total guest farms count
   */
  static getGuestFarmsCount(): number {
    return GuestFarmStorage.getCount();
  }

  /**
   * Check if there are guest farms to migrate
   */
  static hasGuestFarmsToMigrate(): boolean {
    return GuestFarmStorage.hasGuestFarms();
  }
}

export default GuestModeService;
