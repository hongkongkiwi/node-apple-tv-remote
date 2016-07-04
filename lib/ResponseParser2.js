/*
 * node-daap
 * DAAP library for Node.js
 *
 * Copyright (c) 2013 Jeffrey Muller
 * Licensed under the MIT license.
 */

var printable = require('./printable.js');
var bignum = require('bignum');

var field_types = {
    DMAP_UNKNOWN: 0,
    DMAP_UINT: 1,
    DMAP_INT: 2,
    DMAP_STR: 3,
    DMAP_DATA: 4,
    DMAP_DATE: 5,
    DMAP_VERS: 6,
    DMAP_DICT: 7
};

var parser = {

    dmap_types: [
        {"code": "abal", "type": field_types.DMAP_DICT, "name": "daap.browsealbumlisting"},
        {"code": "abar", "type": field_types.DMAP_DICT, "name": "daap.browseartistlisting"},
        {"code": "abcp", "type": field_types.DMAP_DICT, "name": "daap.browsecomposerlisting"},
        {"code": "abgn", "type": field_types.DMAP_DICT, "name": "daap.browsegenrelisting"},
        {"code": "abpl", "type": field_types.DMAP_UINT, "name": "daap.baseplaylist"},
        {"code": "abro", "type": field_types.DMAP_DICT, "name": "daap.databasebrowse"},
        {"code": "adbs", "type": field_types.DMAP_DICT, "name": "daap.databasesongs"},
        {"code": "aeAD", "type": field_types.DMAP_DICT, "name": "com.apple.itunes.adam-ids-array"},
        {"code": "aeAI", "type": field_types.DMAP_UINT, "name": "com.apple.itunes.itms-artistid"},
        {"code": "aeCD", "type": field_types.DMAP_DATA, "name": "com.apple.itunes.flat-chapter-data"},
        {"code": "aeCF", "type": field_types.DMAP_UINT, "name": "com.apple.itunes.cloud-flavor-id"},
        {"code": "aeCI", "type": field_types.DMAP_UINT, "name": "com.apple.itunes.itms-composerid"},
        {"code": "aeCK", "type": field_types.DMAP_UINT, "name": "com.apple.itunes.cloud-library-kind"},
        {"code": "aeCM", "type": field_types.DMAP_UINT, "name": "com.apple.itunes.cloud-status"},
        {"code": "aeCR", "type": field_types.DMAP_STR, "name": "com.apple.itunes.content-rating"},
        {"code": "aeCS", "type": field_types.DMAP_UINT, "name": "com.apple.itunes.artworkchecksum"},
        {"code": "aeCU", "type": field_types.DMAP_UINT, "name": "com.apple.itunes.cloud-user-id"},
        {"code": "aeCd", "type": field_types.DMAP_UINT, "name": "com.apple.itunes.cloud-id"},
        {"code": "aeDP", "type": field_types.DMAP_UINT, "name": "com.apple.itunes.drm-platform-id"},
        {"code": "aeDR", "type": field_types.DMAP_UINT, "name": "com.apple.itunes.drm-user-id"},
        {"code": "aeDV", "type": field_types.DMAP_UINT, "name": "com.apple.itunes.drm-versions"},
        {"code": "aeEN", "type": field_types.DMAP_STR, "name": "com.apple.itunes.episode-num-str"},
        {"code": "aeES", "type": field_types.DMAP_UINT, "name": "com.apple.itunes.episode-sort"},
        {"code": "aeGD", "type": field_types.DMAP_UINT, "name": "com.apple.itunes.gapless-enc-dr"},
        {"code": "aeGE", "type": field_types.DMAP_UINT, "name": "com.apple.itunes.gapless-enc-del"},
        {"code": "aeGH", "type": field_types.DMAP_UINT, "name": "com.apple.itunes.gapless-heur"},
        {"code": "aeGI", "type": field_types.DMAP_UINT, "name": "com.apple.itunes.itms-genreid"},
        {"code": "aeGR", "type": field_types.DMAP_UINT, "name": "com.apple.itunes.gapless-resy"},
        {"code": "aeGU", "type": field_types.DMAP_UINT, "name": "com.apple.itunes.gapless-dur"},
        {"code": "aeGs", "type": field_types.DMAP_UINT, "name": "com.apple.itunes.can-be-genius-seed"},
        {"code": "aeHC", "type": field_types.DMAP_UINT, "name": "com.apple.itunes.has-chapter-data"},
        {"code": "aeHD", "type": field_types.DMAP_UINT, "name": "com.apple.itunes.is-hd-video"},
        {"code": "aeHV", "type": field_types.DMAP_UINT, "name": "com.apple.itunes.has-video"},
        {"code": "aeK1", "type": field_types.DMAP_UINT, "name": "com.apple.itunes.drm-key1-id"},
        {"code": "aeK2", "type": field_types.DMAP_UINT, "name": "com.apple.itunes.drm-key2-id"},
        {"code": "aeMC", "type": field_types.DMAP_UINT, "name": "com.apple.itunes.playlist-contains-media-type-count"},
        {"code": "aeMK", "type": field_types.DMAP_UINT, "name": "com.apple.itunes.mediakind"},
        {"code": "aeMX", "type": field_types.DMAP_STR, "name": "com.apple.itunes.movie-info-xml"},
        {"code": "aeMk", "type": field_types.DMAP_UINT, "name": "com.apple.itunes.extended-media-kind"},
        {"code": "aeND", "type": field_types.DMAP_UINT, "name": "com.apple.itunes.non-drm-user-id"},
        {"code": "aeNN", "type": field_types.DMAP_STR, "name": "com.apple.itunes.network-name"},
        {"code": "aeNV", "type": field_types.DMAP_UINT, "name": "com.apple.itunes.norm-volume"},
        {"code": "aePC", "type": field_types.DMAP_UINT, "name": "com.apple.itunes.is-podcast"},
        {"code": "aePI", "type": field_types.DMAP_UINT, "name": "com.apple.itunes.itms-playlistid"},
        {"code": "aePP", "type": field_types.DMAP_UINT, "name": "com.apple.itunes.is-podcast-playlist"},
        {"code": "aePS", "type": field_types.DMAP_UINT, "name": "com.apple.itunes.special-playlist"},
        {"code": "aeRD", "type": field_types.DMAP_UINT, "name": "com.apple.itunes.rental-duration"},
        {"code": "aeRP", "type": field_types.DMAP_UINT, "name": "com.apple.itunes.rental-pb-start"},
        {"code": "aeRS", "type": field_types.DMAP_UINT, "name": "com.apple.itunes.rental-start"},
        {"code": "aeRU", "type": field_types.DMAP_UINT, "name": "com.apple.itunes.rental-pb-duration"},
        {"code": "aeSE", "type": field_types.DMAP_UINT, "name": "com.apple.itunes.store-pers-id"},
        {"code": "aeSF", "type": field_types.DMAP_UINT, "name": "com.apple.itunes.itms-storefrontid"},
        {"code": "aeSG", "type": field_types.DMAP_UINT, "name": "com.apple.itunes.saved-genius"},
        {"code": "aeSI", "type": field_types.DMAP_UINT, "name": "com.apple.itunes.itms-songid"},
        {"code": "aeSN", "type": field_types.DMAP_STR, "name": "com.apple.itunes.series-name"},
        {"code": "aeSP", "type": field_types.DMAP_UINT, "name": "com.apple.itunes.smart-playlist"},
        {"code": "aeSU", "type": field_types.DMAP_UINT, "name": "com.apple.itunes.season-num"},
        {"code": "aeSV", "type": field_types.DMAP_VERS, "name": "com.apple.itunes.music-sharing-version"},
        {"code": "aeXD", "type": field_types.DMAP_STR, "name": "com.apple.itunes.xid"},
        {"code": "aemi", "type": field_types.DMAP_DICT, "name": "com.apple.itunes.media-kind-listing-item"},
        {"code": "aeml", "type": field_types.DMAP_DICT, "name": "com.apple.itunes.media-kind-listing"},
        {"code": "agac", "type": field_types.DMAP_UINT, "name": "daap.groupalbumcount"},
        {"code": "agma", "type": field_types.DMAP_UINT, "name": "daap.groupmatchedqueryalbumcount"},
        {"code": "agmi", "type": field_types.DMAP_UINT, "name": "daap.groupmatchedqueryitemcount"},
        {"code": "agrp", "type": field_types.DMAP_STR, "name": "daap.songgrouping"},
        {"code": "aply", "type": field_types.DMAP_DICT, "name": "daap.databaseplaylists"},
        {"code": "aprm", "type": field_types.DMAP_UINT, "name": "daap.playlistrepeatmode"},
        {"code": "apro", "type": field_types.DMAP_VERS, "name": "daap.protocolversion"},
        {"code": "apsm", "type": field_types.DMAP_UINT, "name": "daap.playlistshufflemode"},
        {"code": "apso", "type": field_types.DMAP_DICT, "name": "daap.playlistsongs"},
        {"code": "arif", "type": field_types.DMAP_DICT, "name": "daap.resolveinfo"},
        {"code": "arsv", "type": field_types.DMAP_DICT, "name": "daap.resolve"},
        {"code": "asaa", "type": field_types.DMAP_STR, "name": "daap.songalbumartist"},
        {"code": "asac", "type": field_types.DMAP_UINT, "name": "daap.songartworkcount"},
        {"code": "asai", "type": field_types.DMAP_UINT, "name": "daap.songalbumid"},
        {"code": "asal", "type": field_types.DMAP_STR, "name": "daap.songalbum"},
        {"code": "asar", "type": field_types.DMAP_STR, "name": "daap.songartist"},
        {"code": "asas", "type": field_types.DMAP_UINT, "name": "daap.songalbumuserratingstatus"},
        {"code": "asbk", "type": field_types.DMAP_UINT, "name": "daap.bookmarkable"},
        {"code": "asbo", "type": field_types.DMAP_UINT, "name": "daap.songbookmark"},
        {"code": "asbr", "type": field_types.DMAP_UINT, "name": "daap.songbitrate"},
        {"code": "asbt", "type": field_types.DMAP_UINT, "name": "daap.songbeatsperminute"},
        {"code": "ascd", "type": field_types.DMAP_UINT, "name": "daap.songcodectype"},
        {"code": "ascm", "type": field_types.DMAP_STR, "name": "daap.songcomment"},
        {"code": "ascn", "type": field_types.DMAP_STR, "name": "daap.songcontentdescription"},
        {"code": "asco", "type": field_types.DMAP_UINT, "name": "daap.songcompilation"},
        {"code": "ascp", "type": field_types.DMAP_STR, "name": "daap.songcomposer"},
        {"code": "ascr", "type": field_types.DMAP_UINT, "name": "daap.songcontentrating"},
        {"code": "ascs", "type": field_types.DMAP_UINT, "name": "daap.songcodecsubtype"},
        {"code": "asct", "type": field_types.DMAP_STR, "name": "daap.songcategory"},
        {"code": "asda", "type": field_types.DMAP_DATE, "name": "daap.songdateadded"},
        {"code": "asdb", "type": field_types.DMAP_UINT, "name": "daap.songdisabled"},
        {"code": "asdc", "type": field_types.DMAP_UINT, "name": "daap.songdisccount"},
        {"code": "asdk", "type": field_types.DMAP_UINT, "name": "daap.songdatakind"},
        {"code": "asdm", "type": field_types.DMAP_DATE, "name": "daap.songdatemodified"},
        {"code": "asdn", "type": field_types.DMAP_UINT, "name": "daap.songdiscnumber"},
        {"code": "asdp", "type": field_types.DMAP_DATE, "name": "daap.songdatepurchased"},
        {"code": "asdr", "type": field_types.DMAP_DATE, "name": "daap.songdatereleased"},
        {"code": "asdt", "type": field_types.DMAP_STR, "name": "daap.songdescription"},
        {"code": "ased", "type": field_types.DMAP_UINT, "name": "daap.songextradata"},
        {"code": "aseq", "type": field_types.DMAP_STR, "name": "daap.songeqpreset"},
        {"code": "ases", "type": field_types.DMAP_UINT, "name": "daap.songexcludefromshuffle"},
        {"code": "asfm", "type": field_types.DMAP_STR, "name": "daap.songformat"},
        {"code": "asgn", "type": field_types.DMAP_STR, "name": "daap.songgenre"},
        {"code": "asgp", "type": field_types.DMAP_UINT, "name": "daap.songgapless"},
        {"code": "asgr", "type": field_types.DMAP_UINT, "name": "daap.supportsgroups"},
        {"code": "ashp", "type": field_types.DMAP_UINT, "name": "daap.songhasbeenplayed"},
        {"code": "askd", "type": field_types.DMAP_DATE, "name": "daap.songlastskipdate"},
        {"code": "askp", "type": field_types.DMAP_UINT, "name": "daap.songuserskipcount"},
        {"code": "asky", "type": field_types.DMAP_STR, "name": "daap.songkeywords"},
        {"code": "aslc", "type": field_types.DMAP_STR, "name": "daap.songlongcontentdescription"},
        {"code": "aslr", "type": field_types.DMAP_UINT, "name": "daap.songalbumuserrating"},
        {"code": "asls", "type": field_types.DMAP_UINT, "name": "daap.songlongsize"},
        {"code": "aspc", "type": field_types.DMAP_UINT, "name": "daap.songuserplaycount"},
        {"code": "aspl", "type": field_types.DMAP_DATE, "name": "daap.songdateplayed"},
        {"code": "aspu", "type": field_types.DMAP_STR, "name": "daap.songpodcasturl"},
        {"code": "asri", "type": field_types.DMAP_UINT, "name": "daap.songartistid"},
        {"code": "asrs", "type": field_types.DMAP_UINT, "name": "daap.songuserratingstatus"},
        {"code": "asrv", "type": field_types.DMAP_INT, "name": "daap.songrelativevolume"},
        {"code": "assa", "type": field_types.DMAP_STR, "name": "daap.sortartist"},
        {"code": "assc", "type": field_types.DMAP_STR, "name": "daap.sortcomposer"},
        {"code": "assl", "type": field_types.DMAP_STR, "name": "daap.sortalbumartist"},
        {"code": "assn", "type": field_types.DMAP_STR, "name": "daap.sortname"},
        {"code": "assp", "type": field_types.DMAP_UINT, "name": "daap.songstoptime"},
        {"code": "assr", "type": field_types.DMAP_UINT, "name": "daap.songsamplerate"},
        {"code": "asss", "type": field_types.DMAP_STR, "name": "daap.sortseriesname"},
        {"code": "asst", "type": field_types.DMAP_UINT, "name": "daap.songstarttime"},
        {"code": "assu", "type": field_types.DMAP_STR, "name": "daap.sortalbum"},
        {"code": "assz", "type": field_types.DMAP_UINT, "name": "daap.songsize"},
        {"code": "astc", "type": field_types.DMAP_UINT, "name": "daap.songtrackcount"},
        {"code": "astm", "type": field_types.DMAP_UINT, "name": "daap.songtime"},
        {"code": "astn", "type": field_types.DMAP_UINT, "name": "daap.songtracknumber"},
        {"code": "asul", "type": field_types.DMAP_STR, "name": "daap.songdataurl"},
        {"code": "asur", "type": field_types.DMAP_UINT, "name": "daap.songuserrating"},
        {"code": "asvc", "type": field_types.DMAP_UINT, "name": "daap.songprimaryvideocodec"},
        {"code": "asyr", "type": field_types.DMAP_UINT, "name": "daap.songyear"},
        {"code": "ated", "type": field_types.DMAP_UINT, "name": "daap.supportsextradata"},
        {"code": "avdb", "type": field_types.DMAP_DICT, "name": "daap.serverdatabases"},
        {"code": "caar", "type": field_types.DMAP_UINT, "name": "dacp.availablerepeatstates"},
        {"code": "caas", "type": field_types.DMAP_UINT, "name": "dacp.availableshufflestates"},
        {"code": "caci", "type": field_types.DMAP_DICT, "name": "caci"},
        {"code": "cafe", "type": field_types.DMAP_UINT, "name": "dacp.fullscreenenabled"},
        {"code": "cafs", "type": field_types.DMAP_UINT, "name": "dacp.fullscreen"},
        {"code": "caia", "type": field_types.DMAP_UINT, "name": "dacp.isactive"},
        {"code": "cana", "type": field_types.DMAP_STR, "name": "dacp.nowplayingartist"},
        {"code": "cang", "type": field_types.DMAP_STR, "name": "dacp.nowplayinggenre"},
        {"code": "canl", "type": field_types.DMAP_STR, "name": "dacp.nowplayingalbum"},
        {"code": "cann", "type": field_types.DMAP_STR, "name": "dacp.nowplayingname"},
        {"code": "canp", "type": field_types.DMAP_UINT, "name": "dacp.nowplayingids"},
        {"code": "cant", "type": field_types.DMAP_UINT, "name": "dacp.nowplayingtime"},
        {"code": "capr", "type": field_types.DMAP_VERS, "name": "dacp.protocolversion"},
        {"code": "caps", "type": field_types.DMAP_UINT, "name": "dacp.playerstate"},
        {"code": "carp", "type": field_types.DMAP_UINT, "name": "dacp.repeatstate"},
        {"code": "cash", "type": field_types.DMAP_UINT, "name": "dacp.shufflestate"},
        {"code": "casp", "type": field_types.DMAP_DICT, "name": "dacp.speakers"},
        {"code": "cast", "type": field_types.DMAP_UINT, "name": "dacp.songtime"},
        {"code": "cavc", "type": field_types.DMAP_UINT, "name": "dacp.volumecontrollable"},
        {"code": "cave", "type": field_types.DMAP_UINT, "name": "dacp.visualizerenabled"},
        {"code": "cavs", "type": field_types.DMAP_UINT, "name": "dacp.visualizer"},
        {"code": "ceJC", "type": field_types.DMAP_UINT, "name": "com.apple.itunes.jukebox-client-vote"},
        {"code": "ceJI", "type": field_types.DMAP_UINT, "name": "com.apple.itunes.jukebox-current"},
        {"code": "ceJS", "type": field_types.DMAP_UINT, "name": "com.apple.itunes.jukebox-score"},
        {"code": "ceJV", "type": field_types.DMAP_UINT, "name": "com.apple.itunes.jukebox-vote"},
        {"code": "ceQR", "type": field_types.DMAP_DICT, "name": "com.apple.itunes.playqueue-contents-response"},
        {"code": "ceQa", "type": field_types.DMAP_STR, "name": "com.apple.itunes.playqueue-album"},
        {"code": "ceQg", "type": field_types.DMAP_STR, "name": "com.apple.itunes.playqueue-genre"},
        {"code": "ceQn", "type": field_types.DMAP_STR, "name": "com.apple.itunes.playqueue-name"},
        {"code": "ceQr", "type": field_types.DMAP_STR, "name": "com.apple.itunes.playqueue-artist"},
        {"code": "cmgt", "type": field_types.DMAP_DICT, "name": "dmcp.getpropertyresponse"},
        {"code": "cmmk", "type": field_types.DMAP_UINT, "name": "dmcp.mediakind"},
        {"code": "cmpr", "type": field_types.DMAP_VERS, "name": "dmcp.protocolversion"},
        {"code": "cmsr", "type": field_types.DMAP_UINT, "name": "dmcp.serverrevision"},
        {"code": "cmst", "type": field_types.DMAP_DICT, "name": "dmcp.playstatus"},
        {"code": "cmvo", "type": field_types.DMAP_UINT, "name": "dmcp.volume"},
        {"code": "ipsa", "type": field_types.DMAP_DICT, "name": "dpap.iphotoslideshowadvancedoptions"},
        {"code": "ipsl", "type": field_types.DMAP_DICT, "name": "dpap.iphotoslideshowoptions"},
        {"code": "mbcl", "type": field_types.DMAP_DICT, "name": "dmap.bag"},
        {"code": "mccr", "type": field_types.DMAP_DICT, "name": "dmap.contentcodesresponse"},
        {"code": "mcna", "type": field_types.DMAP_STR, "name": "dmap.contentcodesname"},
        {"code": "mcnm", "type": field_types.DMAP_UINT, "name": "dmap.contentcodesnumber"},
        {"code": "mcon", "type": field_types.DMAP_DICT, "name": "dmap.container"},
        {"code": "mctc", "type": field_types.DMAP_UINT, "name": "dmap.containercount"},
        {"code": "mcti", "type": field_types.DMAP_UINT, "name": "dmap.containeritemid"},
        {"code": "mcty", "type": field_types.DMAP_UINT, "name": "dmap.contentcodestype"},
        {"code": "mdbk", "type": field_types.DMAP_UINT, "name": "dmap.databasekind"},
        {"code": "mdcl", "type": field_types.DMAP_DICT, "name": "dmap.dictionary"},
        {"code": "mdst", "type": field_types.DMAP_UINT, "name": "dmap.downloadstatus"},
        {"code": "meds", "type": field_types.DMAP_UINT, "name": "dmap.editcommandssupported"},
        {"code": "miid", "type": field_types.DMAP_UINT, "name": "dmap.itemid"},
        {"code": "mikd", "type": field_types.DMAP_UINT, "name": "dmap.itemkind"},
        {"code": "mimc", "type": field_types.DMAP_UINT, "name": "dmap.itemcount"},
        {"code": "minm", "type": field_types.DMAP_STR, "name": "dmap.itemname"},
        {"code": "mlcl", "type": field_types.DMAP_DICT, "name": "dmap.listing"},
        {"code": "mlid", "type": field_types.DMAP_UINT, "name": "dmap.sessionid"},
        {"code": "mlit", "type": field_types.DMAP_DICT, "name": "dmap.listingitem"},
        {"code": "mlog", "type": field_types.DMAP_DICT, "name": "dmap.loginresponse"},
        {"code": "mpco", "type": field_types.DMAP_UINT, "name": "dmap.parentcontainerid"},
        {"code": "mper", "type": field_types.DMAP_UINT, "name": "dmap.persistentid"},
        {"code": "mpro", "type": field_types.DMAP_VERS, "name": "dmap.protocolversion"},
        {"code": "mrco", "type": field_types.DMAP_UINT, "name": "dmap.returnedcount"},
        {"code": "mrpr", "type": field_types.DMAP_UINT, "name": "dmap.remotepersistentid"},
        {"code": "msal", "type": field_types.DMAP_UINT, "name": "dmap.supportsautologout"},
        {"code": "msas", "type": field_types.DMAP_UINT, "name": "dmap.authenticationschemes"},
        {"code": "msau", "type": field_types.DMAP_UINT, "name": "dmap.authenticationmethod"},
        {"code": "msbr", "type": field_types.DMAP_UINT, "name": "dmap.supportsbrowse"},
        {"code": "msdc", "type": field_types.DMAP_UINT, "name": "dmap.databasescount"},
        {"code": "msex", "type": field_types.DMAP_UINT, "name": "dmap.supportsextensions"},
        {"code": "msix", "type": field_types.DMAP_UINT, "name": "dmap.supportsindex"},
        {"code": "mslr", "type": field_types.DMAP_UINT, "name": "dmap.loginrequired"},
        {"code": "msma", "type": field_types.DMAP_UINT, "name": "dmap.machineaddress"},
        {"code": "msml", "type": field_types.DMAP_DICT, "name": "msml"},
        {"code": "mspi", "type": field_types.DMAP_UINT, "name": "dmap.supportspersistentids"},
        {"code": "msqy", "type": field_types.DMAP_UINT, "name": "dmap.supportsquery"},
        {"code": "msrs", "type": field_types.DMAP_UINT, "name": "dmap.supportsresolve"},
        {"code": "msrv", "type": field_types.DMAP_DICT, "name": "dmap.serverinforesponse"},
        {"code": "mstc", "type": field_types.DMAP_DATE, "name": "dmap.utctime"},
        {"code": "mstm", "type": field_types.DMAP_UINT, "name": "dmap.timeoutinterval"},
        {"code": "msto", "type": field_types.DMAP_INT, "name": "dmap.utcoffset"},
        {"code": "msts", "type": field_types.DMAP_STR, "name": "dmap.statusstring"},
        {"code": "mstt", "type": field_types.DMAP_UINT, "name": "dmap.status"},
        {"code": "msup", "type": field_types.DMAP_UINT, "name": "dmap.supportsupdate"},
        {"code": "mtco", "type": field_types.DMAP_UINT, "name": "dmap.specifiedtotalcount"},
        {"code": "mudl", "type": field_types.DMAP_DICT, "name": "dmap.deletedidlisting"},
        {"code": "mupd", "type": field_types.DMAP_DICT, "name": "dmap.updateresponse"},
        {"code": "musr", "type": field_types.DMAP_UINT, "name": "dmap.serverrevision"},
        {"code": "muty", "type": field_types.DMAP_UINT, "name": "dmap.updatetype"},
        {"code": "pasp", "type": field_types.DMAP_STR, "name": "dpap.aspectratio"},
        {"code": "pcmt", "type": field_types.DMAP_STR, "name": "dpap.imagecomments"},
        {"code": "peak", "type": field_types.DMAP_UINT, "name": "com.apple.itunes.photos.album-kind"},
        {"code": "peed", "type": field_types.DMAP_DATE, "name": "com.apple.itunes.photos.exposure-date"},
        {"code": "pefc", "type": field_types.DMAP_DICT, "name": "com.apple.itunes.photos.faces"},
        {"code": "peki", "type": field_types.DMAP_UINT, "name": "com.apple.itunes.photos.key-image-id"},
        {"code": "pemd", "type": field_types.DMAP_DATE, "name": "com.apple.itunes.photos.modification-date"},
        {"code": "pfai", "type": field_types.DMAP_DICT, "name": "dpap.failureids"},
        {"code": "pfdt", "type": field_types.DMAP_DICT, "name": "dpap.filedata"},
        {"code": "pfmt", "type": field_types.DMAP_STR, "name": "dpap.imageformat"},
        {"code": "phgt", "type": field_types.DMAP_UINT, "name": "dpap.imagepixelheight"},
        {"code": "picd", "type": field_types.DMAP_DATE, "name": "dpap.creationdate"},
        {"code": "pifs", "type": field_types.DMAP_UINT, "name": "dpap.imagefilesize"},
        {"code": "pimf", "type": field_types.DMAP_STR, "name": "dpap.imagefilename"},
        {"code": "plsz", "type": field_types.DMAP_UINT, "name": "dpap.imagelargefilesize"},
        {"code": "ppro", "type": field_types.DMAP_VERS, "name": "dpap.protocolversion"},
        {"code": "prat", "type": field_types.DMAP_UINT, "name": "dpap.imagerating"},
        {"code": "pret", "type": field_types.DMAP_DICT, "name": "dpap.retryids"},
        {"code": "pwth", "type": field_types.DMAP_UINT, "name": "dpap.imagepixelwidth"}
    ],

    isalpha: function(c) {
        return /^[a-zA-Z]*$/.test(c);
    },

    isascii: function(c) {
        return /^[\x00-\x7F]*$/.test(c);
    },

    copy_buffer: function(buffer, start, len) {
        var res = new Buffer(len);

        buffer.copy(res, 0, start, start + len);
        return res;
    },

    get_dmap_type: function(code) {
        var len = this.dmap_types.length;

        for (var i = 0; i < len; i++) {
            if (this.dmap_types[i].code == code) {
                return this.dmap_types[i];
            }
        }
        return null;
    },

    to_int32: function(n) {
        if (n > 2147483647 || n < -2147483648) {
            return 0;
        } else {
            return n;
        }
    },

    dmap_read_64: function(buffer, iterator) {
        return this.to_int32(bignum(buffer.readInt8(0)).and(0xff).shiftLeft(56)) |
            this.to_int32(bignum(buffer.readInt8(1)).and(0xff).shiftLeft(48)) |
            this.to_int32(bignum(buffer.readInt8(2)).and(0xff).shiftLeft(40)) |
            this.to_int32(bignum(buffer.readInt8(3)).and(0xff).shiftLeft(32)) |
            this.to_int32(bignum(buffer.readInt8(4)).and(0xff).shiftLeft(24)) |
            this.to_int32(bignum(buffer.readInt8(5)).and(0xff).shiftLeft(16)) |
            this.to_int32(bignum(buffer.readInt8(6)).and(0xff).shiftLeft(8)) |
            this.to_int32(bignum(buffer.readInt8(7)).and(0xff));
    },

    dmap_read_32: function(buffer, iterator) {
        return ((buffer.readInt8(0) & 0xff) << 24) |
        ((buffer.readInt8(1) & 0xff) << 16) |
        ((buffer.readInt8(2) & 0xff) << 8) |
        ((buffer.readInt8(3) & 0xff));
    },

    dmap_read_16: function(buffer, iterator) {
        return ((buffer[0] & 0xff) << 8) | (buffer[1] & 0xff);
    },

    add_property: function(o, field_name, value) {
        if (o instanceof Array) {
            var item = {};

            item[field_name] = value;
            o.push(item);
        } else if (o[field_name] !== null) {
            var array = [];
            var item1 = {};
            var item2 = {};

            item1[field_name] = o[field_name];
            item2[field_name] = value;
            array.push(item1, item2);
            o = array;
        } else {
            o[field_name] = value;
        }
        return o;
    },

    to_object: function(buffer, size) {
        var item, code, field_type, field_name, o;

        size = (size === null) ? 1 : buffer.length - size + 1;
        o = {};
        while (buffer.length >= size) {
            code = this.copy_buffer(buffer, this.iterator, 4);
            item = this.get_dmap_type(code);
            buffer = buffer.slice(4);

            var field_len = this.dmap_read_32(buffer, this.iterator);
            buffer = buffer.slice(4);

            if (item) {
                field_type = item.type;
                field_name = item.name;
            } else {
                field_type = field_types.DMAP_UNKNOWN;
                field_name = code;

                if (field_len >= 8) {
                    if (this.isalpha(this.copy_buffer(buffer, 0, 4))) {
                        if (this.dmap_read_32(buffer.slice(4)) < field_len)
                            field_type = field_types.DMAP_DICT;
                        }
                }

                if (field_type === field_types.DMAP_UNKNOWN) {
                    var i, is_string = true;

                    for (i = 0; i < field_len; i++) {
                        if (this.isascii(buffer[i]) === false || buffer[i] < 2) {
                            is_string = false;
                            break;
                        }
                    }
                    field_type = (is_string === true) ? field_types.DMAP_STR : field_types.DMAP_UINT;
                }
            }

            switch (field_type) {
                case field_types.DMAP_UINT:
                case field_types.DMAP_INT:
                    switch (field_len) {
                        case 1:
                            o[field_name] = printable.to_int32(buffer[0], code);
                            break;
                        case 2:
                            o[field_name] = printable.to_int32(this.dmap_read_16(buffer), code);
                            break;
                        case 4:
                            o[field_name] = printable.to_int32(this.dmap_read_32(buffer), code);
                            break;
                        case 8:
                            o = this.add_property(o, field_name, printable.to_int32(this.dmap_read_64(buffer), code));
                            break;
                        default:
                            o[field_name] = printable.to_data(buffer, field_len);
                            break;
                    }
                break;
                case field_types.DMAP_STR:
                    o[field_name] = printable.to_string(buffer, 0, field_len);
                    break;
                case field_types.DMAP_DATA:
                    o[field_name] = printable.to_data(buffer, field_len);
                    console.log(o[field_name]);

                    break;
                case field_types.DMAP_DATE:
                    o[field_name] = printable.to_date(this.dmap_read_32(buffer));
                    break;
                case field_types.DMAP_VERS:
                    if (field_len >= 4) {
                        o[field_name] = this.dmap_read_16(buffer) + "." + this.dmap_read_16(buffer);
                    }
                    break;
                case field_types.DMAP_DICT:
                    if ((sub_item = this.to_object(buffer, field_len)) == -1)
                        return -1;
                    o = this.add_property(o, field_name, sub_item);
                    break;
                case field_types.DMAP_UNKNOWN:
                    break;
            }
            buffer = buffer.slice(field_len);
        }
        return o;
    },

    parse: function(buffer) {
        var result = {};
        result = this.to_object(buffer);
        return result;
    }
};

module.exports = parser;
