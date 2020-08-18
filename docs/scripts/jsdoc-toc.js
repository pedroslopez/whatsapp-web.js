(function($) {
    // TODO: make the node ID configurable
    var treeNode = $('#jsdoc-toc-nav');

    // initialize the tree
    treeNode.tree({
        autoEscape: false,
        closedIcon: '&#x21e2;',
        data: [{"label":"<a href=\"global.html\">Globals</a>","id":"global","children":[]},{"label":"<a href=\"Base.html\">Base</a>","id":"Base","children":[]},{"label":"<a href=\"BusinessContact.html\">BusinessContact</a>","id":"BusinessContact","children":[]},{"label":"<a href=\"Chat.html\">Chat</a>","id":"Chat","children":[]},{"label":"<a href=\"Client.html\">Client</a>","id":"Client","children":[]},{"label":"<a href=\"ClientInfo.html\">ClientInfo</a>","id":"ClientInfo","children":[]},{"label":"<a href=\"Contact.html\">Contact</a>","id":"Contact","children":[]},{"label":"<a href=\"GroupChat.html\">GroupChat</a>","id":"GroupChat","children":[]},{"label":"<a href=\"GroupNotification.html\">GroupNotification</a>","id":"GroupNotification","children":[]},{"label":"<a href=\"InterfaceController.html\">InterfaceController</a>","id":"InterfaceController","children":[]},{"label":"<a href=\"Location.html\">Location</a>","id":"Location","children":[]},{"label":"<a href=\"Message.html\">Message</a>","id":"Message","children":[]},{"label":"<a href=\"MessageMedia.html\">MessageMedia</a>","id":"MessageMedia","children":[]},{"label":"<a href=\"PrivateChat.html\">PrivateChat</a>","id":"PrivateChat","children":[]},{"label":"<a href=\"PrivateContact.html\">PrivateContact</a>","id":"PrivateContact","children":[]},{"label":"<a href=\"Util.html\">Util</a>","id":"Util","children":[]}],
        openedIcon: ' &#x21e3;',
        saveState: false,
        useContextMenu: false
    });

    // add event handlers
    // TODO
})(jQuery);
