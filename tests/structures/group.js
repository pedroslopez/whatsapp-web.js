const { expect } = require('chai');
const helper = require('../helper');

const remoteId = helper.remoteId;

describe('Group', function() {
    let client;
    let group;

    before(async function() {
        this.timeout(35000);
        client = helper.createClient({
            authenticated: true, 
        });
        await client.initialize();

        const createRes = await client.createGroup('My Awesome Group', [remoteId]);
        expect(createRes.gid).to.exist;
        await helper.sleep(500);
        group = await client.getChatById(createRes.gid._serialized);
        expect(group).to.exist;
    });

    describe('Settings', function () {
        it('can change the group subject', async function () {
            expect(group.name).to.equal('My Awesome Group');
            const res = await group.setSubject('My Amazing Group');
            expect(res).to.equal(true);

            await helper.sleep(1000);

            // reload
            group = await client.getChatById(group.id._serialized); 
            expect(group.name).to.equal('My Amazing Group');
        });

        it('can change the group description', async function () {
            expect(group.description).to.equal(undefined);
            const res = await group.setDescription('some description');
            expect(res).to.equal(true);
            expect(group.description).to.equal('some description');

            await helper.sleep(1000);

            // reload
            group = await client.getChatById(group.id._serialized); 
            expect(group.description).to.equal('some description');
        });

        it('can set only admins able to send messages', async function () {
            expect(group.groupMetadata.announce).to.equal(false);
            const res = await group.setMessagesAdminsOnly();
            expect(res).to.equal(true);
            expect(group.groupMetadata.announce).to.equal(true);

            // reload
            group = await client.getChatById(group.id._serialized);
            expect(group.groupMetadata.announce).to.equal(true);
        });

        it('can set all participants able to send messages', async function () {
            expect(group.groupMetadata.announce).to.equal(true);
            const res = await group.setMessagesAdminsOnly(false);
            expect(res).to.equal(true);
            expect(group.groupMetadata.announce).to.equal(false);

            // reload
            group = await client.getChatById(group.id._serialized);
            expect(group.groupMetadata.announce).to.equal(false);
        });

        it('can set only admins able to set group info', async function () {
            expect(group.groupMetadata.restrict).to.equal(false);
            const res = await group.setInfoAdminsOnly();
            expect(res).to.equal(true);
            expect(group.groupMetadata.restrict).to.equal(true);

            // reload
            group = await client.getChatById(group.id._serialized);
            expect(group.groupMetadata.restrict).to.equal(true);
        });

        it('can set all participants able to set group info', async function () {
            expect(group.groupMetadata.restrict).to.equal(true);
            const res = await group.setInfoAdminsOnly(false);
            expect(res).to.equal(true);
            expect(group.groupMetadata.restrict).to.equal(false);

            // reload
            group = await client.getChatById(group.id._serialized);
            expect(group.groupMetadata.restrict).to.equal(false);
        });
    });

    describe('Participants', function () {
        it('can promote a user to admin', async function () {
            let participant = group.participants.find(p => p.id._serialized === remoteId);
            expect(participant).to.exist;
            expect(participant.isAdmin).to.equal(false);

            const res = await group.promoteParticipants([remoteId]);
            expect(res.status).to.be.greaterThanOrEqual(200);

            await helper.sleep(1000);

            // reload and check
            group = await client.getChatById(group.id._serialized);
            participant = group.participants.find(p => p.id._serialized=== remoteId);
            expect(participant).to.exist;
            expect(participant.isAdmin).to.equal(true);
        });

        it('can demote a user', async function () {
            let participant = group.participants.find(p => p.id._serialized=== remoteId);
            expect(participant).to.exist;
            expect(participant.isAdmin).to.equal(true);

            const res = await group.demoteParticipants([remoteId]);
            expect(res.status).to.be.greaterThanOrEqual(200);

            await helper.sleep(1000);

            // reload and check
            group = await client.getChatById(group.id._serialized);
            participant = group.participants.find(p => p.id._serialized=== remoteId);
            expect(participant).to.exist;
            expect(participant.isAdmin).to.equal(false);
        });

        it('can remove a user from the group', async function () {
            let participant = group.participants.find(p => p.id._serialized=== remoteId);
            expect(participant).to.exist;

            const res = await group.removeParticipants([remoteId]);
            expect(res.status).to.be.greaterThanOrEqual(200);

            await helper.sleep(1000);

            // reload and check
            group = await client.getChatById(group.id._serialized);
            participant = group.participants.find(p => p.id._serialized=== remoteId);
            expect(participant).to.not.exist;
        });

        it('can add back a user to the group', async function () {
            let participant = group.participants.find(p => p.id._serialized=== remoteId);
            expect(participant).to.not.exist;

            const res = await group.addParticipants([remoteId]);
            expect(res.status).to.be.greaterThanOrEqual(200);

            await helper.sleep(1000);

            // reload and check
            group = await client.getChatById(group.id._serialized);
            participant = group.participants.find(p => p.id._serialized=== remoteId);
            expect(participant).to.exist;
        });
    });

    after(async function () {
        // const otherParticipants = group.participants.filter(p => !p.isSuperAdmin).map(p => p.id._serialized);
        // await group.removeParticipants(otherParticipants);
        await client.destroy();
    });

});
