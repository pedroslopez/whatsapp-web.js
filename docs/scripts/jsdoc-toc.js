(function($) {
    // TODO: make the node ID configurable
    var treeNode = $('#jsdoc-toc-nav');

    // initialize the tree
    treeNode.tree({
        autoEscape: false,
        closedIcon: '&#x21e2;',
        data: [{"label":"<a href=\"global.html\">Globals</a>","id":"global","children":[]},{"label":"<a href=\"Base.html\">Base</a>","id":"Base","children":[]},{"label":"<a href=\"BaseAuthStrategy.html\">BaseAuthStrategy</a>","id":"BaseAuthStrategy","children":[]},{"label":"<a href=\"BusinessContact.html\">BusinessContact</a>","id":"BusinessContact","children":[]},{"label":"<a href=\"Buttons.html\">Buttons</a>","id":"Buttons","children":[]},{"label":"<a href=\"Call.html\">Call</a>","id":"Call","children":[]},{"label":"<a href=\"Chat.html\">Chat</a>","id":"Chat","children":[]},{"label":"<a href=\"Client.html\">Client</a>","id":"Client","children":[]},{"label":"<a href=\"ClientInfo.html\">ClientInfo</a>","id":"ClientInfo","children":[]},{"label":"<a href=\"Contact.html\">Contact</a>","id":"Contact","children":[]},{"label":"<a href=\"GroupChat.html\">GroupChat</a>","id":"GroupChat","children":[]},{"label":"<a href=\"GroupNotification.html\">GroupNotification</a>","id":"GroupNotification","children":[]},{"label":"<a href=\"InterfaceController.html\">InterfaceController</a>","id":"InterfaceController","children":[]},{"label":"<a href=\"Label.html\">Label</a>","id":"Label","children":[]},{"label":"<a href=\"LegacySessionAuth.html\">LegacySessionAuth</a>","id":"LegacySessionAuth","children":[]},{"label":"<a href=\"List.html\">List</a>","id":"List","children":[]},{"label":"<a href=\"LocalAuth.html\">LocalAuth</a>","id":"LocalAuth","children":[]},{"label":"<a href=\"LocalWebCache.html\">LocalWebCache</a>","id":"LocalWebCache","children":[]},{"label":"<a href=\"Location.html\">Location</a>","id":"Location","children":[]},{"label":"<a href=\"Message.html\">Message</a>","id":"Message","children":[]},{"label":"<a href=\"MessageMedia.html\">MessageMedia</a>","id":"MessageMedia","children":[]},{"label":"<a href=\"NoAuth.html\">NoAuth</a>","id":"NoAuth","children":[]},{"label":"<a href=\"Order.html\">Order</a>","id":"Order","children":[]},{"label":"<a href=\"Poll.html\">Poll</a>","id":"Poll","children":[]},{"label":"<a href=\"PrivateChat.html\">PrivateChat</a>","id":"PrivateChat","children":[]},{"label":"<a href=\"PrivateContact.html\">PrivateContact</a>","id":"PrivateContact","children":[]},{"label":"<a href=\"Product.html\">Product</a>","id":"Product","children":[]},{"label":"<a href=\"Reaction.html\">Reaction</a>","id":"Reaction","children":[]},{"label":"<a href=\"RemoteAuth.html\">RemoteAuth</a>","id":"RemoteAuth","children":[]},{"label":"<a href=\"RemoteWebCache.html\">RemoteWebCache</a>","id":"RemoteWebCache","children":[]},{"label":"<a href=\"Util.html\">Util</a>","id":"Util","children":[]},{"label":"<a href=\"WebCache.html\">WebCache</a>","id":"WebCache","children":[]}],
        openedIcon: ' &#x21e3;',
        saveState: false,
        useContextMenu: false
    });

    // add event handlers
    // TODO
})(jQuery);
