// API/src/Modules/Zones/ZoneResolver.ts
import {
  Resolver,
  Query,
  Mutation,
  Arg,
  Authorized,
  Ctx,
  FieldResolver,
  Root,
} from 'type-graphql';
import { Zone } from './ZoneModel';
import { ZoneInput } from './ZoneInput';
import { ZonePermissions, ZoneAccessPermission } from './ZonePermissionModel';
import { AuthContext } from 'API/Context';
import { ResourceRecord } from '../ResourceRecords/ResourceRecordModel';
import { UserRole } from '../Users/UserRole';

@Resolver(() => Zone)
export class ZoneResolver {
  @Authorized()
  @Query(() => [Zone])
  async zones(@Ctx() { currentUser }: AuthContext): Promise<Zone[]> {
    return Zone.getUserZones(currentUser, ZoneAccessPermission.READ);
  }

  @Authorized()
  @Query(() => Zone)
  async zone(
    @Arg('zoneId') zoneId: string,
    @Ctx() { currentUser }: AuthContext,
  ): Promise<Zone> {
    return Zone.getUserZone(currentUser, zoneId, ZoneAccessPermission.READ);
  }

  @Authorized([UserRole.ADMIN])
  @Mutation(() => Zone)
  async createZone(
    @Arg('input') input: ZoneInput,
    @Ctx() { currentUser }: AuthContext,
  ): Promise<Zone> {
    const zone = await Zone.create(input).save();

    await ZonePermissions.create({
      zoneId: zone.id,
      userId: currentUser.id,
      accessPermissions: [
        ZoneAccessPermission.READ,
        ZoneAccessPermission.WRITE,
        ZoneAccessPermission.ADMIN,
      ],
    }).save();

    return zone;
  }

  @FieldResolver(() => [ResourceRecord])
  async resourceRecords(@Root() { id }: Zone): Promise<ResourceRecord[]> {
    return ResourceRecord.find({ zoneId: id });
  }
}
