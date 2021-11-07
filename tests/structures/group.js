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
            await group.setSubject('My Amazing Group');

            // reload
            group = await client.getChatById(group.id._serialized); 

            expect(group.name).to.equal('My Amazing Group');
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
        const otherParticipants = group.participants.filter(p => !p.isSuperAdmin).map(p => p.id._serialized);
        await group.removeParticipants(otherParticipants);
        await client.destroy();
    });

});
