// Lorb index javascript


// Utility functions

function parseBool(value, defaultValue) {
    return (value == 'true' || value == 'false' || value === true || value === false) && JSON.parse(value) || defaultValue;
}

function randomString(length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

function generateUuid() {
    // return Math.random().toString().slice(2) +
    //        Math.random().toString().slice(2) +
    //        Math.random().toString().slice(2);
    return randomString(32, '0123456789abcdefghijklmnopqrstuvwxyz');
}

function clone_2d_arr(arr) {
    var res = [];
    for (var i = 0; i < arr.length; i++) {
        res[i] = arr[i].slice();
    }
    return res;
    // return JSON.parse(JSON.stringify(arr));
};

function conv_name(name) {
    if (name === -1) {
        return '';
    }
    return name;
}


// Constants

const hostn = "https://lorb.gg";
// const hostn = "http://192.168.0.18:8080";
// const hostn = "https://" + document.location.hostname;
const status_fade_duration = 300;           // Status box fade in/out duration in milliseconds
const refresh_sleep_time = (7 + 1) * 1000;  // Number of milliseconds to sleep for before refreshing
const cached_lifespan = 60 * 5 * 1000;      // Cached request lifespan in milliseconds

const session_id = generateUuid();

// joined the lobby strings
const region_strs = [
    'EUW',
    'EUNE',
    'NA',
    'KR',
    'OCE',
    'BR',
    'RU',
    'LAN',
    'LAS',
    'JP',
    'TR',
]
const joined_lobby_strs = [
    [ // euw: english, german, spanish, french, ital1an
        ['', " joined the lobby"],
        ['', " ist der Lobby beigetreten"],
        ['', " se ha unido a la sala."],
        ['', " a rejoint le salon"],
        ['', " si è unito alla lobby"],
    ],
    [ // eune: english, czech, polish, greek, hungarian, romanian
        ['', " joined the lobby"],
        ['', " vstoupil do lobby"],
        ['', " dołącza do pokoju"],
        ['Ο παίκτης ', " μπήκε στο λόμπι"],
        ['', " csatlakozott az előszobához"],
        ['', " s-a alăturat lobby-ului"],
    ],
    [ // na: english
        ['', " joined the lobby"],
    ],
    [ // kr: korean (not yet known)
        ['', " joined the lobby"],
    ],
    [ // oce: english
        ['', " joined the lobby"],
    ],
    [ // br: portuguese
        ['', " entrou no saguão"],
    ],
    [ // ru: russian
        ['', " присоединился к лобби"],
    ],
    [ // lan: latino spanish
        ['', " se unió a la sala"],
    ],
    [ // las: latino spanish
        ['', " se unió a la sala"],
    ],
    [ // jp: japanese
        ['', "がロビーに参加しました"],
    ],
    [ // tr: turkish
        ['', " lobiye katıldı"],
    ],
]

const date_form = { 'weekday': 'long', 'year': 'numeric', 'month': 'long', 'day': 'numeric' };
const time_form = { 'hour': 'numeric', 'minute': '2-digit', 'hour12': true };

const team_li = 0; // Indexes of each feature in req_data
const role_li = 1;
const cid_li = 2;
const name_li = 3;

const ch_cid_li = 0; // Indexes of each feature in champ_list
const ch_id_li = 1;
const ch_name_li = 2;


// Globals

var request_cache = {};


// App
$( function() {

    var i = 0;

    $( "#status_area" ).fadeOut(0);
    $( "#share_area" ).fadeOut(0);
    $( "#perc_warning_symb" ).fadeOut(0);
    $( "#champions_perc_warning_symb" ).fadeOut(0);
    $( "#summoners_perc_warning_symb" ).fadeOut(0);
    $( "#champions_perc_area" ).fadeOut(0);
    $( "#summoners_perc_area" ).fadeOut(0);
    $( "#recc_cont" ).fadeOut(0);
    $( "#timestamp_area" ).fadeOut(0);
    // $( "#recc_outer_area" ).fadeOut(0);
    // $( ".recc_button" ).fadeOut(0);

    var showing_share = false;
    var ts_area_vis = false;

    var saved_shortlink = false;

    // $( "#elo_info" ).tooltip({ // Setup tooltip(s)
    //     position: { my: "right top", at: "left bottom", collision: "none", },
    //     relative: true,
    //     // of: $( "#elo_text" ),
    //     // using: function(position, feedback) { $( this ).css(position); } }
    // });

    // Set region from cookie
    var region = 0;
    var lang_i = 0;
    var reg_ind_ck = Cookies.get('region_index');
    if (typeof reg_ind_ck != 'undefined') {
        try {
            reg_ind_ck = parseInt(reg_ind_ck);
            region = reg_ind_ck;
            $( "#region_select" )[0].selectedIndex = region;
        } catch (err) {
            console.log(err);
        }
    }
    var reg_str = $( "#region_select :selected" ).val();

    // Set average elo from cookie
    var avg_elo = 0;
    var elo_ind_ck = Cookies.get('elo_index');
    if (typeof elo_ind_ck != 'undefined') {
        try {
            elo_ind_ck = parseInt(elo_ind_ck);
            avg_elo = elo_ind_ck;
            $( "#elo_select" )[0].selectedIndex = avg_elo;
        } catch (err) {
            console.log(err);
        }
    }

    // Set expected win/loss lp from cookie
    var win_lp = 15;
    var loss_lp = 15;
    var wl_lp_ck = Cookies.get('wl_lp');
    if (typeof wl_lp_ck != 'undefined') {
        try {
            const wl_lp = JSON.parse(wl_lp_ck)
            win_lp = wl_lp[0];
            loss_lp = wl_lp[1];
            $( "#win_lp_input" ).val(win_lp);
            $( "#loss_lp_input" ).val(loss_lp);
            update_expected_lp();
        } catch (err) {
            console.log(err);
        }
    }

    var disp_winning_p = true;
    var disp_winning_p_ck = Cookies.get('disp_winning_p');
    if (typeof disp_winning_p_ck != 'undefined') {
        try {
            disp_winning_p = parseBool(disp_winning_p_ck);
            $( this ).prop('checked', disp_winning_p);
        } catch (err) {
            console.log(err);
        }
    }

    // Import champion data
    // $.getJSON( , function( data ) {
    // {

    // Constants
    var data = JSON.parse(champ_data);
    var champ_list = data["list"];   // Riot champion data
    var role_aa_order = data["role_fill_order"]; // Order in which to auto assign roles
    var champ_role_is_ordered = data["champ_role_is_ordered"]; // Champion role frequency orderings

    // Create dictionary from indexes to cids
    var champ_ind_dict = {};
    for (var i = 0; i < champ_list.length; i++) {
        champ_ind_dict[champ_list[i][ch_cid_li]] = i;
    }

    var ddrag_ver = "8.20.1";
    var ddrag_url = "https://ddragon.leagueoflegends.com/cdn/" + ddrag_ver + "/img/champion/";
    var none_champ_img = "imgs/none_champ.png";
    var roles_opts_lower = ['auto assign', 'top', 'jungle', 'mid', 'support', 'bottom'];
    var roles_opts = [roles_opts_lower[0]];
    for (i = 1; i < 6; i++) {
        roles_opts[i] = roles_opts_lower[i].toUpperCase();
    }

    // Champion grid element (also do pick recommendation content)
    var grid_content = '';
    var recc_content = '';
    for (var i = 0; i < champ_list.length; i++) {
        var img_url = none_champ_img;
        var cid = champ_list[i][ch_cid_li];
        var ch_id = champ_list[i][ch_id_li];
        if (i > 0) {
            img_url = ddrag_url + ch_id + '.png';
        }
        var c_name = champ_list[i][ch_name_li];
        if (c_name.slice(0, 4) == "None") {
            c_name = "None";
        }
        var extra_style = '';
        if (c_name == "Nunu & Willump") {
            extra_style = 'style="font-size: 6px;" ';
        }
        if (
          c_name == "Miss Fortune" ||
          c_name == "Tahm Kench" ||
          c_name == "Twisted Fate" ||
          c_name == "Aurelion Sol"
          ) {
            extra_style = 'style="font-size: 8px;" ';
        }
        grid_content += '<button style="background-image: url(\'' + img_url +
            '\');" height="60" width="60" class="grid_img" id="grid_img_' + i + '">' + 
            '<span ' + extra_style + 'class="grid_img_text" id="grid_img_text_' + i + '">' +
             c_name + '</span></button>';

        // Pick recommendation box content
        if (i > 0) {
            recc_content += '<div id="recc_ch_' + cid + '" class="recc_champion recc_champion_ch" cid_i="' + i + '" ' + 
                'style="top: ' + (18 * (i - 1)) + 'px;">' +
                '<div class="recc_thumb" style="background-image: url(\'' + img_url + '\');"></div>' +
                '<div class="recc_name">' + c_name + '</div>' +
                '<div id="recc_ch_' + cid + '_perc" class="recc_perc">99.9%</div>' +
                '</div>';
            recc_content += '<div id="recc_pl_' + cid + '" class="recc_champion recc_champion_pl" cid_i="' + i + '" ' + 
                'style="top: ' + (18 * (i - 1)) + 'px;">' +
                '<div class="recc_thumb" style="background-image: url(\'' + img_url + '\');"></div>' +
                '<div class="recc_name">' + c_name + '</div>' +
                '<div id="recc_pl_' + cid + '_perc" class="recc_perc">99.9%</div>' +
                '</div>';
        }
    }
    $( "body" ).append($('<div id="champion_grid_cont"><div id="champion_grid">' +
        grid_content + '</div></div>'));
    $( "#recc_inner_area" ).html(recc_content);

    // Data
    // var pl_roles = [0, 1, 2, 3, 4, 0, 1, 2, 3, 4]; // Stores actual roles (0 - 4 inclusive)
    // var req_data_init = [
    var req_data = [
        [ 0, 0, -1, -1 ],
        [ 0, 1, -1, -1 ],
        [ 0, 2, -1, -1 ],
        [ 0, 3, -1, -1 ],
        [ 0, 4, -1, -1 ],
        [ 1, 0, -1, -1 ],
        [ 1, 1, -1, -1 ],
        [ 1, 2, -1, -1 ],
        [ 1, 3, -1, -1 ],
        [ 1, 4, -1, -1 ],
    ];
    // var req_data = [];
    var last_preq_hash = null;
    var last_preq_recc_hash = null;

    var curr_req_i = 0;
    var curr_perc = 50;
    var curr_perc_ch = 50;
    var curr_perc_pl = 50;
    var curr_deg = 270;
    var curr_deg_ch = 270;
    var curr_deg_pl = 270;
    var inv_perc = false;
    var pl_indices = {};
    var pl_indices_inv = {};
    var pl_percs = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1];
    var refreshes = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1];
    var last_req_t = 0;
    var waiting_for_refresh = -1;
    var selected_ch_indices; // Selected champion list indices for each pl
    var disp_champs_perc = false;
    var disp_summs_perc = false;
    var curr_req_disp = 999;

    var rq_data = [];
    var pl_ropts = [];
    var rdict = [];
    function initialise_vars() {
        // req_data = clone_2d_arr(req_data_init);
        pl_ropts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        rdict = [[], []];
        for (var i = 0; i < 5; i++) {
            req_data[i][cid_li] = -1;
            req_data[i][name_li] = -1;
            req_data[i + 5][cid_li] = -1;
            req_data[i + 5][name_li] = -1;
            rdict[0][i] = -1;
            rdict[1][i] = -1;
        }
        curr_req_i += 1000;
        curr_perc = 50;
        update_expected_lp();
        curr_perc_ch = 50;
        curr_perc_pl = 50;
        curr_deg = 270;
        curr_deg_ch = 270;
        curr_deg_pl = 270;
        pl_indices = {};
        pl_indices_inv = {};
        waiting_for_refresh = -1;
        selected_ch_indices = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    }
    initialise_vars();

    var last_doc_click = 0;
    var last_sd_click = 0;

    var app_height = $( "#app_area" ).height();
    var app_width = $( "#app_area" ).width();

    var plph_occupancy = {}; // For each placeholder, which pl_i player occupies it

    // var pl_inner = '<form id="myForm" action="comment.php" method="post"> ' +
    //     'Name: <input type="text" name="name" /> ' + 
    //     'Comment: <textarea name="comment"></textarea> ' + 
    //     '<input type="submit" value="Submit Comment" /></form>'
    var pl_inner = '<div class="champion_buttons">' + 
        '<button class="grid_button"></button>' +
        '<button class="search_button"></button></div>' + 
        '<div class="champion_box"></div>' + 
        '<div class="role_cont"><select class="role_select">';
    for (var i = 0; i < 6; i++) {
        pl_inner += '<option value=' + i + ' class="role_option role_option_' + i + '">' + roles_opts[i] + '</option>';
    }
    pl_inner += '</select></div>' +
        '<button class="recc_button">&#128161;</button>' +
        '<div class="name_cont">' +
        '<input type="text" placeholder="enter summoner" class="name_input" value=""></input>' +
        // '<div class="name_clear">&#128465;</div>' +
        '<div class="name_clear"><div class="cross"></div></div>' +
        // '<button class="name_submit"></button></div>' +
        '<div class="pl_status_text"></div>' + 
        '<div class="pl_opgg_link"><a class="pl_opgg_link_a" href="" target="_blank"></a></div>' +
        '';

    // Create left side player objects, and all player placeholders
    for (var i = 0; i < 5; i++) {
        $( "#pl_area" ).append($('<div id="pl_' + i + '" class="pl pl_obj pl_w_obj" plph_id="plph_l_' +
            i + '">' + pl_inner + '</div>'));
        plph_occupancy['plph_l_' + i] = i;
        $( "#l_team_area" ).append($('<div id="plph_l_' + i + '" class="plph pl_obj pl_w_obj"></div>'));
        $( "#r_team_area" ).append($('<div id="plph_r_' + i + '" class="plph pl_obj pl_w_obj"></div>'));
    }

    // Get dimensions info from new objects
    var pl_height = $( ".pl" ).height();
    var pl_width = $( ".pl" ).width(); // for some reason this sometimes returns the width + 1...
    // pl_width -= 1;
    var pl_tot_height = 5 * pl_height;
    var r_pl_x = app_width - pl_width; // right side player object x co-ordinate

    // Create right side player objects and move all to correct positions
    for (i = 5; i < 10; i++) {
        $( "#pl_area" ).append($('<div id="pl_' + i + '" class="pl pl_obj pl_w_obj" plph_id="plph_r_' + 
            (i - 5) + '">' + pl_inner + '</div>'));
        plph_occupancy['plph_r_' + (i - 5)] = i;
        $( "#pl_" + i ).css('left', r_pl_x);
        $( "#pl_" + i ).css('top', (i - 5) * pl_height);
        $( "#pl_" + (i - 5) ).css('top', (i - 5) * pl_height);
    }

    // Define champion search dropdown box
    var search_dropdown_inner = '<div class="search_dropdown">' +
        '<select data-placeholder="None [unknown]" class="chosen-select search_select" tabindex="1">';
    for (var i = 0; i < champ_list.length; i++) {
        ch = champ_list[i];
        search_dropdown_inner += '<option value="' + ch[ch_cid_li] + '">' + ch[ch_name_li] + '</option>';
    }
    search_dropdown_inner += '</select></div>';
    $( "#pl_area" ).append(search_dropdown_inner);

    var ch_pl_i = 0; // Current pl index for which we are selecting a champion

    // Define team colour switching
    var left_col = "blue";
    var left_text_col = "#ddddff";
    var left_text_col_l = "#636bff";
    var left_ptxt_shadow_col = 
        "0px 0px 5px #004, 0px 0px 10px #004, 0px 0px 20px #004, 0px 0px 30px #004";//, 0px 0px 50px #004, 0px 0px 50px #004";
    // var left_text_col = "#66ccff";
    var right_col = "red";
    var right_text_col = "#ffb3b3";
    var right_text_col_l = "#ff5959";
    var right_ptxt_shadow_col = 
        "0px 0px 5px #300, 0px 0px 10px #300, 0px 0px 20px #300, 0px 0px 30px #300";//, 0px 0px 50px #300, 0px 0px 50px #300";
    $( "#l_team_col_text" ).html(left_col);
    $( "#l_team_col_text" ).css("color", left_text_col_l);
    $( "#r_team_col_text" ).html(right_col);
    $( "#r_team_col_text" ).css("color", right_text_col_l);
    $( "#res_team_col" ).html(left_col);
    $( "#res_team_col" ).css('color', left_text_col);
    $( "#champions_perc_team_col" ).html(left_col)
    $( "#champions_perc_team_col" ).css('color', left_text_col);
    $( "#summoners_perc_team_col" ).html(left_col)
    $( "#summoners_perc_team_col" ).css('color', left_text_col);
    $( "#perc_text" ).css('text-shadow', left_ptxt_shadow_col)
    $( "#win_text" ).css('text-shadow', left_ptxt_shadow_col)
    $( "#champions_perc_team_col" ).css('text-shadow', left_ptxt_shadow_col)
    $( "#summoners_perc_team_col" ).css('text-shadow', left_ptxt_shadow_col)
    $( "#champions_perc" ).css('text-shadow', left_ptxt_shadow_col)
    $( "#summoners_perc" ).css('text-shadow', left_ptxt_shadow_col)
    $( "#perc_symb" ).css('text-shadow', left_ptxt_shadow_col)
    $( "#champions_perc_symb" ).css('text-shadow', left_ptxt_shadow_col)
    $( "#summoners_perc_symb" ).css('text-shadow', left_ptxt_shadow_col)
    function swap_sides() {
        left_col = [right_col, right_col = left_col][0]; // Swap variable values (pre-ES6 compatible)
        left_text_col = [right_text_col, right_text_col = left_text_col][0];
        left_text_col_l = [right_text_col_l, right_text_col_l = left_text_col_l][0];
        left_ptxt_shadow_col = [right_ptxt_shadow_col, right_ptxt_shadow_col = left_ptxt_shadow_col][0];
        $( "#l_team_col_text" ).html(left_col);
        $( "#l_team_col_text" ).css("color", left_text_col_l);
        $( "#r_team_col_text" ).html(right_col);
        $( "#r_team_col_text" ).css("color", right_text_col_l);
        $( "#res_team_col" ).html(left_col);
        $( "#res_team_col" ).css('color', left_text_col);
        $( "#champions_perc_team_col" ).html(left_col)
        $( "#champions_perc_team_col" ).css('color', left_text_col);
        $( "#summoners_perc_team_col" ).html(left_col)
        $( "#summoners_perc_team_col" ).css('color', left_text_col);
        $( "#perc_text" ).css('text-shadow', left_ptxt_shadow_col)
        $( "#win_text" ).css('text-shadow', left_ptxt_shadow_col)
        $( "#champions_perc_team_col" ).css('text-shadow', left_ptxt_shadow_col)
        $( "#summoners_perc_team_col" ).css('text-shadow', left_ptxt_shadow_col)
        $( "#champions_perc" ).css('text-shadow', left_ptxt_shadow_col)
        $( "#summoners_perc" ).css('text-shadow', left_ptxt_shadow_col)
        $( "#perc_symb" ).css('text-shadow', left_ptxt_shadow_col)
        $( "#champions_perc_symb" ).css('text-shadow', left_ptxt_shadow_col)
        $( "#summoners_perc_symb" ).css('text-shadow', left_ptxt_shadow_col)

        // Change result percentage for opposite team
        inv_perc = !inv_perc;
    }
    $( "#switch_cols_button" ).click(function() {
        swap_sides();
        // Change request data values
        for (var i = 0; i < 10; i++) {
            req_data[i][team_li] = 1 - req_data[i][team_li];
        }
        setTimeout(request_curr_pred, 0);
    });
    $( ".team_col_text" ).click(function() {
        swap_sides();
        // Change request data values
        for (var i = 0; i < 10; i++) {
            req_data[i][team_li] = 1 - req_data[i][team_li];
        }
        setTimeout(request_curr_pred, 0);
    });

    function set_opgg_link(pl, name) {
        if (name === '') {
            pl.find( '.pl_opgg_link' ).find( '.pl_opgg_link_a' ).html('');
            return;
        }
        var reg_str_url = reg_str;
        if (reg_str == 'kr') {
            reg_str_url = 'www';
        }
        const opgg_link = "http://" + reg_str_url + ".op.gg/summoner/userName=" + name;
        pl.find( '.pl_opgg_link' ).find( '.pl_opgg_link_a' ).attr('href', opgg_link);
        pl.find( '.pl_opgg_link' ).find( '.pl_opgg_link_a' ).html('op.gg');
    }

    // Auto assign roles
    function auto_assign_roles() {
        for (side = 0; side < 2; side++) { // For each team
            var side_char = side === 0 ? 'l' : 'r';
            // var side_char = side === 0 ? (inv_perc ? 'r' : 'l') : (inv_perc ? 'l' : 'r');
            // pl_is = [];
            // pl_is_i = 0;
            // for (key in plph_occupancy) {
            //     if (key[5] == side_char) {
            //         pl_is[pl_is_i] = plph_occupancy[key];
            //         pl_is_i++;
            //     }
            // }
            var aa_roles = {};
            var champions = {};
            var no_champs_pls = {};
            for (var j = 0; j < 5; j++) {
                var pl_i = plph_occupancy["plph_" + side_char + '_' + j];
                if (pl_ropts[pl_i] === 0) {
                    var cid = req_data[pl_i][cid_li];
                    if (cid !== -1) {
                        champions[cid] = pl_i;
                    } else {
                        no_champs_pls[pl_i] = null;
                    }
                }
                if (rdict[side][j] === -1) {
                    aa_roles[j] = null;
                }
            }
            j = 0;
            var champion_inds_mins = [];
            var ch_keys = Object.keys(champions);
            for (cid in ch_keys) {
                // cid = parseInt(cid);
                champion_inds_mins[j] = Math.min(champ_role_is_ordered[cid]);
            }
            var sorted_cids = ch_keys
                .map((item, j) => [champion_inds_mins[j], item])
                .sort(([count1], [count2]) => count1 - count2)
                .map(([, item]) => item);
            for (let cid of sorted_cids) {
                var ris = Object.keys(aa_roles);
                ris = ris
                    .map((item, j) => [champ_role_is_ordered[cid][parseInt(item)], item])
                    .sort(([count1], [count2]) => count1 - count2)
                    .map(([, item]) => item);
                var role = ris[0];

                var pl_i = champions[cid];
                delete champions[cid];
                delete aa_roles[role];
                role = parseInt(role);
                // pl_roles[pl_i] = role;
                req_data[pl_i][role_li] = role;
                // rdict[side][role] = pl_i;
                $( "#pl_" + pl_i ).find(".role_cont").find(".role_select").find(
                    ".role_option_0").html(roles_opts[role + 1] + " &nbsp(auto assign)");
            }
            for (var pl_i in no_champs_pls) { // Assign remaining roles in order (no champion info)
                var role = parseInt(Object.keys(aa_roles)[0]);
                // if (roles_opts[role + 1] == undefined) {
                // }
                delete aa_roles[role];
                // pl_roles[pl_i] = role;
                req_data[pl_i][role_li] = role;
                // rdict[side][role] = pl_i;
                $( "#pl_" + pl_i ).find(".role_cont").find(".role_select").find(
                    ".role_option_0").html(roles_opts[role + 1] + " &nbsp(auto assign)");
            }
        }
    }

    function reset_everything() {
        var prev_comp = Cookies.get('match_composition')
        if (typeof prev_comp != 'undefined') {
            Cookies.set('match_composition_previous', prev_comp);
            Cookies.remove('match_composition');
        }
        $( "#perc_text" ).css("color", "#999");
        $( ".j_perc" ).css("color", "#999");
        if ((errored || $( "#status_area" ).css("opacity") == 1)) {
            errored = false;
            $( "#status_area" ).fadeOut(status_fade_duration);
        }
        if (showing_share) {
            $( "#share_area" ).fadeOut();
        }
    }

    function prep_req_data(rd) {

        for (var team_i = 0; team_i < 2; team_i++) {
            // var side = team_i === 0 ? (inv_p ? 'r' : 'l') : (inv_p ? 'l' : 'r');
            var side = team_i === 0 ? 'l' : 'r';
            var team_i_act = inv_perc ? 1 - team_i : team_i;
            for (var i = 0; i < 5; i++) {
                if (rd[plph_occupancy["plph_" + side + '_' + i]][team_li] !== team_i_act) {
                    console.log("Invalid cookie team, prediction request failed");
                    console.log(rdict);
                    console.log(pl_ropts);
                    console.log(plph_occupancy);
                    console.log(rd);
                    console.log(inv_perc);
                    reset_everything();
                    var plph_str = '{';
                    for (key in plph_occupancy) {
                        plph_str += key + ':' + plph_occupancy[key] + ', ';
                    }
                    plph_str += '}';
                    alert('Fatal error! Heisenbug code-' + 420 +
                        ', please send a report with details on what you were doing when' + 
                        ' this box appeared to contact@lorb.gg and give copy this information: \n' +
                        'PLPH: ' + plph_str + '\nRD: ' + rd + "\n" + 
                        'The page will now refresh. Click undo to restore previous composition.\n' +
                        'Apologies for any inconvenience caused.');
                    reset_everything();
                    window.location.href = "";
                    return false;
                }
            }
        }

        pl_indices = {};
        pl_indices_inv = {};

        // Fix duplicate roles (try)
        var b_roles_taken = {};
        var r_roles_taken = {};
        var b_fix_roles = [];
        var r_fix_roles = [];
        var b_fr_i = 0;
        var r_fr_i = 0;
        for (var i = 0; i < 10; i++) {
            r = rd[i][role_li];
            if (rd[i][team_li] === 0) {
                if (r in b_roles_taken) {
                    console.log("Fixing duplicate role: " + i + '-' + r);
                    console.log(pl_ropts, rdict)
                    b_fix_roles[b_fr_i] = i;
                    b_fr_i++;
                } else {
                    b_roles_taken[r] = i;
                }
            } else if (rd[i][team_li] === 1) {
                if (r in r_roles_taken) {
                    console.log("Fixing duplicate role: " + i + '-' + r);
                    console.log(pl_ropts, rdict)
                    r_fix_roles[r_fr_i] = i;
                    r_fr_i++;
                } else {
                    r_roles_taken[r] = i;
                }
            }
        }
        b_fr_i = 0;
        r_fr_i = 0;
        for (ri = 0; ri < 5; ri++) {
            if (!(ri in b_roles_taken)) {
                i = b_fix_roles[b_fr_i];
                b_fr_i++;
                rd[i][role_li] = ri;
                $( "#pl_" + i ).find(".role_cont").find(".role_select")[0].selectedIndex = ri;
            }
            if (!(ri in r_roles_taken)) {
                i = r_fix_roles[r_fr_i];
                r_fr_i++;
                rd[i][role_li] = ri;
                $( "#pl_" + i ).find(".role_cont").find(".role_select")[0].selectedIndex = ri;
            }
        }

        // Reorder
        var rord = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (var i = 0; i < 10; i++) {
            rord[(rd[i][team_li] * 5) + rd[i][role_li]] = i;
        }

        // Slim request
        var rq_data = [];
        var rq_i = 0;
        for (var i = 0; i < 10; i++) {
            const ord_i = rord[i];
            const rd_ = rd[ord_i];
            const name = rd_[name_li];
            if (rd_[cid_li] != -1 || name != -1) {
                rq_data[rq_i] = rd_.slice(0, 3);
                if (name != -1) {
                    rq_data[rq_i][name_li] = ('' + name).trim().slice(0, 16).toLowerCase();
                } else {
                    rq_data[rq_i][name_li] = -1;
                }
                pl_indices[rq_i] = ord_i;
                pl_indices_inv[ord_i] = rq_i;
                rq_i++;
            }
        }
        return [rq_data, rq_i];
    }

    function get_current_comp() {
        return {
            "data": req_data,
            "pl_ropts": pl_ropts,
            "inv_perc": inv_perc,
            "placeholders": plph_occupancy,
            "pl_indices": pl_indices,
            "pl_indices_inv": pl_indices_inv,
            "region_i": region,
            "avg_elo_i": avg_elo,
        };
    }

    // Request the prediction for the current data & update the displayed result reqcurr
    function request_curr_pred() {
        var d = new Date();
        last_req_t = d.getTime();

        var prep_req = prep_req_data(req_data);
        var rq_data = prep_req[0];
        const rq_i = prep_req[1];
        
        reset_pl_statuses();
        if (rq_i == 0) {  // Return if we have no input data
            reset_everything();
            return;
        }

        // Store request data in cookie (keep previous cookie for undo button)
        const curr_comp = get_current_comp();
        const prev_comp = Cookies.get('match_composition')
        if (typeof prev_comp != 'undefined') {
            Cookies.set('match_composition_previous', prev_comp);
        }
        Cookies.set('match_composition', curr_comp);

        // Disable pick recommendation buttons until we receive response
        $( ".recc_button" ).css('opacity', 0.5);
        $( ".recc_button" ).attr('disabled', true);

        // Set loading symbols
        $( "#perc_text" ).css("color", "#999");
        $( ".j_perc" ).css("color", "#999");
        $( ".orb_load_ring" ).css("visibility", "visible");

        const hash = get_request_hash(rq_data);
        last_preq_hash = hash;
        if (hash in request_cache) {  // If request cached locally
            cache_load(hash, receive_res);  // Load from cache
            curr_req_disp = curr_req_i;
        } else {
            // Else send request
            send_pred_req(rq_data, -1, curr_comp, receive_curr_pred);
        }

        curr_req_i++;
    }

    function send_pred_req(rq_data, shortlink, comp, callback) {
        var d = [rq_data, region, avg_elo, curr_req_i, session_id, shortlink, comp];
        var server_url = hostn + "/match/";
        $.post(server_url, JSON.stringify(d), callback, "json");
        // $.ajax({
        //         url: server_url,
        //         data: JSON.stringify(d),
        //         type: 'POST',
        //         dataType: 'json', 
        //         // contentType: "application/json", 
        //         success: receive_curr_pred,

        //         // "crossDomain": true,
        //         // "headers": {
        //             // "accept": "application/json",
        //             // "Access-Control-Allow-Origin": "*",
        //             // "Accept-Encoding": "gzip"
        //         // }

        //         // beforeSend: function(xhr) {
        //         //     xhr.setRequestHeader("Content-Encoding", "gzip");
        //         // },
        //     }
        // );
        // setTimeout(function() {receive_curr_pred(res, "success");}, 200); // Simulate processing time
    }

    function load_comp(comp) {
        var ph_occ = comp["placeholders"];
        var inv_p = comp["inv_perc"];
        var rdata = comp["data"];
        var ropts = comp["pl_ropts"];


        // Check team sides make sense
        for (var team_i = 0; team_i < 2; team_i++) {
            // var side = team_i === 0 ? (inv_p ? 'r' : 'l') : (inv_p ? 'l' : 'r');
            var side = team_i === 0 ? 'l' : 'r';
            var team_i_act = inv_p ? 1 - team_i : team_i;
            for (var i = 0; i < 5; i++) {
                if (rdata[ph_occ["plph_" + side + '_' + i]][team_li] !== team_i_act) {
                    console.log("Invalid cookie team, not loading composition.");
                    return false;
                }
            }
        }

        if ("pl_indices" in comp) {
            pl_indices = comp["pl_indices"]
            pl_indices_inv = comp["pl_indices_inv"]
        }

        if ("region_i" in comp) {
            set_region(comp["region_i"]);
        }
        if ("avg_elo_i" in comp) {
            set_avg_elo(comp["avg_elo_i"]);
        }

        if (inv_perc !== inv_p) {
            swap_sides();
        }

        // pl_ropts = [0,0,0,0,0,0,0,0,0,0];
        rdict = [[], []];
        for (var i = 0; i < 5; i++) {
            rdict[0][i] = -1;
            rdict[1][i] = -1;
        }

        for (var team_i = 0; team_i < 2; team_i++) {
            // var side = team_i === 0 ? (inv_p ? 'r' : 'l') : (inv_p ? 'l' : 'r');
            var side = team_i === 0 ? 'l' : 'r';
            for (var i = 0; i < 5; i++) {
                var plph_id = "plph_" + side + '_' + i;
                var old_pl_i = ph_occ[plph_id];
                var pl_i = plph_occupancy[plph_id];
                var rd = rdata[old_pl_i];

                // var rd = rdata[old_pl_i].slice();
                req_data[pl_i] = rd;
                var ropt = ropts[old_pl_i];
                pl_ropts[pl_i] = ropt;
                var pl = $( "#pl_" + pl_i );

                // Set role vars
                var r_sel = pl.find( ".role_cont" ).find( ".role_select" );
                r_sel[0].selectedIndex = ropt;
                if (ropt > 0) {
                    r_sel.css('color', '#fff');
                    rdict[team_i][ropt - 1] = pl_i;
                } else {
                    r_sel.css('color', '#888');
                }

                // Set name vars
                var name = rd[name_li];
                if (name != -1) {
                    pl.find( ".name_cont" ).find( ".name_input" ).val('' + name);
                    set_opgg_link(pl, name);
                } else {
                    pl.find( ".name_cont" ).find( ".name_input" ).val('');
                    set_opgg_link(pl, '');
                }
                pl.find( ".pl_status_text" ).html("");

                // Set champion vars
                var cid = rd[cid_li];
                var cind = champ_ind_dict[cid];
                selected_ch_indices[pl_i] = cind;
                if (cid !== -1) {
                    pl.find( '.champion_box' ).css(
                        "background-image", 'url(' + ddrag_url + champ_list[cind][ch_id_li] + '.png)');
                } else {
                    pl.find( '.champion_box' ).css(
                        "background-image", 'url(' + none_champ_img + ')');
                }
            }
        }

        $( "#perc_warning_symb" ).fadeOut();
        $( "#status_area" ).fadeOut(status_fade_duration);
        $( "#perc_text" ).css("color", "#999");
        $( ".j_perc" ).css("color", "#999");
        // req_data = clone_2d_arr(req_data);
        auto_assign_roles();
        // setTimeout(request_curr_pred, 0);
        return true;
    }

    function reset_pl_statuses() {
        for (var i = 0; i < req_data.length; i++) {
            var txt = $( "#pl_" + i ).find( ".pl_status_text" );
            if (req_data[i][name_li] == -1) {
                txt.html("");
                continue;
            }
            const loadin_str_1 = '<span style="color:#ccc">';
            const loadin_str_2 = '' + " loading..." + '</span>'
            var loadin_str = loadin_str_1 + loadin_str_2;
            if (pl_percs[i] !== -1) {
                const existing_txt = txt.html();
                if (existing_txt.indexOf("loading...") !== -1) {
                    continue;
                }
                if (existing_txt.indexOf("refreshing...") !== -1) {
                    loadin_str = existing_txt.slice(0, existing_txt.indexOf("refreshing...")) + loadin_str_2
                } else {
                    loadin_str = existing_txt + loadin_str_1 + loadin_str_2
                }
            }
            txt.html(loadin_str);
        }
    }

    function animateRotate (object,fromDeg,toDeg,duration,callback){
        var dummy = $('<span style="margin-left:'+fromDeg+'px;">')
        $(dummy).animate({
            "margin-left":toDeg+"px"
        },
        {
            duration:duration,
            step: function(now,fx){
                $(object).css('transform','rotate(' + now + 'deg)');
                if(now == toDeg){
                    if(typeof callback == "function"){
                        callback();
                    }
                }
            }
        });
    }

    function get_request_hash(prep_req) {
        var d = new Date();
        const hash_ts = Math.floor(d.getTime() / cached_lifespan);
        return JSON.stringify([prep_req, region, avg_elo, hash_ts]);
    }

    function cache_store(hash, res) {
        request_cache[hash] = JSON.stringify(res);
        setTimeout(function() {
            delete request_cache[hash];
        }, cached_lifespan * 1.2);
    }

    function cache_load(hash, callback) {
        res = JSON.parse(request_cache[hash]);
        callback(res);
    }

    function receive_res(res) {
    
        var perc = curr_perc;
        var perc_ch = curr_perc_ch;
        var perc_pl = curr_perc_pl;
        var got_perc_ch = false;
        var got_perc_pl = false;
        perc = res[0];
        perc_ch = res[1];
        perc_pl = res[2];
        if (perc_ch !== -1) {
            got_perc_ch = true;
        }
        if (perc_pl !== -1) {
            got_perc_pl = true;
        }
        if (inv_perc) {
            perc = 100.0 - perc;
            perc_ch = 100.0 - perc_ch;
            perc_pl = 100.0 - perc_pl;
        }

        // Store response summoner percentages
        var pl_ps = res[7];
        if (pl_ps instanceof Array) {
            for (var i = 0; i < req_data.length; i++) {
                var rq_i = pl_indices_inv[i];
                var pl_perc = pl_ps[rq_i];
                if (req_data[i][team_li] === 1) {
                    pl_perc = 100 - pl_perc;
                }
                pl_percs[i] = Math.round(pl_perc);
            }
        }

        // Handle summoner request error codes
        handle_summoner_codes(res);

        // Set share link
        var new_url = hostn + "/?c=" + res[8];
        $( "#share_input" ).val(new_url);
        $( "#share_suff_text" ).html("");
        if (!showing_share) {
            $( "#share_area" ).fadeIn();
        }

        if (got_perc_ch) {
            if (!disp_champs_perc) {
                $( "#champions_perc_area" ).fadeIn();
                disp_champs_perc = true;
            }
        } else {
            if (disp_champs_perc) {
                $( "#champions_perc_area" ).fadeOut();
                disp_champs_perc = false;
            }
        }
        if (got_perc_pl) {
            if (!disp_summs_perc) {
                $( "#summoners_perc_area" ).fadeIn();
                disp_summs_perc = true;
            }
        } else {
            if (disp_summs_perc) {
                $( "#summoners_perc_area" ).fadeOut();
                disp_summs_perc = false;
            }
        }

        const prev_perc = curr_perc;
        const prev_perc_ch = curr_perc_ch;
        const prev_perc_pl = curr_perc_pl;
        curr_perc = perc;
        update_expected_lp();
        curr_perc_ch = perc_ch;
        curr_perc_pl = perc_pl;
        const perc_delta = curr_perc - prev_perc;
        const perc_delta_ch = curr_perc_ch - prev_perc_ch;
        const perc_delta_pl = curr_perc_pl - prev_perc_pl;
        const perc_delta_abs = Math.abs(perc_delta);
        const perc_delta_abs_ch = Math.abs(perc_delta_ch);
        const perc_delta_abs_pl = Math.abs(perc_delta_pl);
        // $( "#perc_text" ).html(perc);

        const warning_threshold = 49.5;
        if (perc_delta_abs > 0) {
            const anim_t = ((Math.min(perc_delta_abs, 50) / 50) * 1000) + 300;

            // Figure out whether to display enemy (winning) percentage
            const disp_enemy_p = disp_winning_p && perc < 50.0;
            const disp_enemy_p_ch = disp_winning_p && perc_ch < 50.0;
            const disp_enemy_p_pl = disp_winning_p && perc_pl < 50.0;
            const number = disp_enemy_p ? 100.0 - perc : perc;
            const number_ch = disp_enemy_p_ch ? 100.0 - perc_ch : perc_ch;
            const number_pl = disp_enemy_p_pl ? 100.0 - perc_pl : perc_pl;
            const prev_disp_enemy_p = disp_winning_p && prev_perc < 50.0;
            const prev_disp_enemy_p_ch = disp_winning_p && prev_perc_ch < 50.0;
            const prev_disp_enemy_p_pl = disp_winning_p && prev_perc_pl < 50.0;
            const prev_number = prev_disp_enemy_p ? 100.0 - prev_perc : prev_perc;
            const prev_number_ch = prev_disp_enemy_p_ch ? 100.0 - prev_perc_ch : prev_perc_ch;
            const prev_number_pl = prev_disp_enemy_p_pl ? 100.0 - prev_perc_pl : prev_perc_pl;

            const first_t = (Math.abs(50 - prev_number) / perc_delta_abs) * anim_t;
            const first_t_ch = (Math.abs(50 - prev_number_ch) / perc_delta_abs_ch) * anim_t;
            const first_t_pl = (Math.abs(50 - prev_number_pl) / perc_delta_abs_pl) * anim_t;
            const second_t = (Math.abs(50 - number) / perc_delta_abs) * anim_t;
            const second_t_ch = (Math.abs(50 - number_ch) / perc_delta_abs_ch) * anim_t;
            const second_t_pl = (Math.abs(50 - number_pl) / perc_delta_abs_pl) * anim_t;

            const switching_sides = 
               ((disp_winning_p && disp_enemy_p && prev_perc >= 50.0) ||
                (disp_winning_p && (!disp_enemy_p) && prev_perc < 50.0));
            const switching_sides_ch = 
               ((disp_winning_p && disp_enemy_p_ch && prev_perc_ch >= 50.0) ||
                (disp_winning_p && (!disp_enemy_p_ch) && prev_perc_ch < 50.0));
            const switching_sides_pl = 
               ((disp_winning_p && disp_enemy_p_pl && prev_perc_pl >= 50.0) ||
                (disp_winning_p && (!disp_enemy_p_pl) && prev_perc_pl < 50.0));

            setTimeout(function() {
                $( "#res_team_col" ).html(disp_enemy_p ? right_col : left_col);
                $( "#res_team_col" ).css('color', disp_enemy_p ? right_text_col : left_text_col);
                $( "#perc_text" ).css('text-shadow', disp_enemy_p ? right_ptxt_shadow_col : left_ptxt_shadow_col)
                $( "#win_text" ).css('text-shadow', disp_enemy_p ? right_ptxt_shadow_col : left_ptxt_shadow_col)
                $( "#perc_symb" ).css('text-shadow', disp_enemy_p ? right_ptxt_shadow_col : left_ptxt_shadow_col)
            }, switching_sides ? first_t * 0.92 : anim_t / 2);

            if (got_perc_ch) {
                setTimeout(function() {
                    $( "#champions_perc_team_col" ).html(disp_enemy_p_ch ? right_col : left_col);
                    $( "#champions_perc_team_col" ).css('color', disp_enemy_p_ch ? right_text_col : left_text_col);
                    $( "#champions_perc_team_col" ).css('text-shadow', disp_enemy_p_ch ? right_ptxt_shadow_col : left_ptxt_shadow_col);
                    $( "#champions_perc" ).css('text-shadow', disp_enemy_p_ch ? right_ptxt_shadow_col : left_ptxt_shadow_col);
                    $( "#champions_perc_symb" ).css('text-shadow', disp_enemy_p_ch ? right_ptxt_shadow_col : left_ptxt_shadow_col);
                }, switching_sides_ch ? first_t_ch * 0.92 : anim_t / 2);
                // if (perc_ch < warning_threshold && (prev_perc_ch >= warning_threshold)) {
                if (perc_ch < warning_threshold) {
                    $( "#champions_perc_warning_symb" ).fadeIn();
                // } else if(perc_ch >= warning_threshold && prev_perc_ch < warning_threshold) {
                // } else if(perc_ch >= warning_threshold) {
                } else {
                    $( "#champions_perc_warning_symb" ).fadeOut();
                }
                if (switching_sides_ch) {
                    // Animate the first half
                    $( "#champions_perc" ).prop('number', prev_number_ch).animateNumber({
                            number: 50,
                        },
                        first_t_ch * 0.92,
                        'linear',
                    );
                    // and then the second
                    $( "#champions_perc" ).prop('number', 50).animateNumber({
                            number: Math.round(number_ch),
                        },
                        second_t_ch * 0.92,
                        'linear',
                    );
                } else {
                    // else the whole thing as one
                    $( "#champions_perc" ).prop('number', prev_number_ch).animateNumber({
                            number: Math.round(number_ch),
                        },
                        anim_t,
                        'linear',
                    );
                }
                const new_deg_ch = 270 + ((180 * ((100 - perc_ch) / 100)) - 90);
                animateRotate($( "#champions_perc_meter" ), curr_deg_ch, new_deg_ch, anim_t, null);
                curr_deg_ch = new_deg_ch;
            } else {
                $( "#champions_perc_warning_symb" ).fadeOut();
            }

            if (got_perc_pl) {
                setTimeout(function() {
                    $( "#summoners_perc_team_col" ).html(disp_enemy_p_pl ? right_col : left_col);
                    $( "#summoners_perc_team_col" ).css('color', disp_enemy_p_pl ? right_text_col : left_text_col);
                    $( "#summoners_perc_team_col" ).css('text-shadow', disp_enemy_p_pl ? right_ptxt_shadow_col : left_ptxt_shadow_col);
                    $( "#summoners_perc" ).css('text-shadow', disp_enemy_p_pl ? right_ptxt_shadow_col : left_ptxt_shadow_col);
                    $( "#summoners_perc_symb" ).css('text-shadow', disp_enemy_p_pl ? right_ptxt_shadow_col : left_ptxt_shadow_col);
                }, switching_sides_pl ? first_t_pl * 0.92 : anim_t / 2);
                // if (perc_pl < warning_threshold && prev_perc_pl >= warning_threshold) {
                if (perc_pl < warning_threshold) {
                    $( "#summoners_perc_warning_symb" ).fadeIn();
                // } else if(perc_pl >= warning_threshold && prev_perc_pl < warning_threshold) {
                // } else if(perc_pl >= warning_threshold) {
                } else {
                    $( "#summoners_perc_warning_symb" ).fadeOut();
                }
                if (switching_sides_pl) {
                    // Animate the first half
                    $( "#summoners_perc" ).prop('number', prev_number_pl).animateNumber({
                            number: 50,
                        },
                        first_t_pl * 0.92,
                        'linear',
                    );
                    // and then the second
                    $( "#summoners_perc" ).prop('number', 50).animateNumber({
                            number: Math.round(number_pl),
                        },
                        second_t_pl * 0.92,
                        'linear',
                    );
                } else {
                    // else the whole thing as one
                    $( "#summoners_perc" ).prop('number', prev_number_pl).animateNumber({
                            number: Math.round(number_pl),
                        },
                        anim_t,
                        'linear',
                    );
                }
                const new_deg_pl = 270 + ((180 * ((100 - perc_pl) / 100)) - 90);
                animateRotate($( "#summoners_perc_meter" ), curr_deg_pl, new_deg_pl, anim_t, null);
                curr_deg_pl = new_deg_pl;
            } else {
                $( "#summoners_perc_warning_symb" ).fadeOut();
            }

            // if (perc < warning_threshold && prev_perc >= warning_threshold) {
            if (perc < warning_threshold) {
                $( "#perc_warning_symb" ).fadeIn();
            } else if(perc >= warning_threshold && prev_perc < warning_threshold) {
                $( "#perc_warning_symb" ).fadeOut();
            }

            // If we were previously not displaying the enemy percentage (and need to now), or
            // if we were previously displaying the enemy percentage (and don't need to now)
            if (switching_sides) {
                // Animate the first half
                $( "#perc_text" ).prop('number', prev_number).animateNumber({
                        number: 50,
                    },
                    first_t * 0.92,
                    'linear',
                );
                // and then the second
                $( "#perc_text" ).prop('number', 50).animateNumber({
                        number: Math.round(number),
                    },
                    second_t * 0.92,
                    'linear',
                );
            } else {
                // else the whole thing as one
                $( "#perc_text" ).prop('number', prev_number).animateNumber({
                        number: Math.round(number),
                    },
                    anim_t,
                    'linear',
                );
            }
            const new_deg = 270 + ((180 * ((100 - perc) / 100)) - 90);
            animateRotate($( "#perc_meter" ), curr_deg, new_deg, anim_t, null);
            curr_deg = new_deg;
        };
        // if (req_i == curr_req_i - 1) {
        $( "#perc_text" ).css("color", "#fff");
        $( ".j_perc" ).css("color", "#fff");
        $( ".orb_load_ring" ).css("visibility", "hidden")
        // }
        // curr_req_disp = req_i;
    }

    var errored = false;
    var refresh_ts = 0;
    $( "#status_area" ).css('visibility', 'visible');
    $( "#perc_warning_symb" ).css('visibility', 'visible');
    $( "#share_area" ).css('visibility', 'visible');
    $( "#champions_perc_area" ).css('visibility', 'visible');
    $( "#summoners_perc_area" ).css('visibility', 'visible');
    $( "#recc_cont" ).css('visibility', 'visible');
    $( "#timestamp_area" ).css('visibility', 'visible');
    // $( ".recc_button" ).css('visibility', 'visible');
    function receive_curr_pred(res, status) { // reccurr

        // If we're currently loading reccomendations, ignore response
        if (recc_pl_i !== -1) {
            return;
        }

        // res = JSON.parse(res); // Already parsed because content type = application/json
        var req_i = -1;
        if (status === "success") {
            req_i = res[3];
            // if (req_i >= curr_req_disp) {
            // if (req_i >= curr_req_i - 5) {
            if (req_i >= curr_req_i - 1) {
                // curr_req_disp = req_i;
            } else {
                return;
            }
        } else {
            console.log("Request failed with status: " + status);
            console.log(res);
        }

        // If request was for a shortlinked game, load composition
        const shortlink_comp = res[9];
        if (shortlink_comp != -1) {
            if (!load_comp(shortlink_comp)) {
                console.log("Error loading shortlinked composition...");
                return;
            }
            saved_shortlink = true;
            const shortlink_ts = res[10];
            var sl_date = new Date(shortlink_ts * 1000);
            const d = sl_date.toLocaleDateString(undefined, date_form);
            const t = sl_date.toLocaleTimeString(undefined, time_form).toLowerCase().replace(' ', '');
            $( "#timestamp_text" ).html(t + ',<br />' + d);
            if (!ts_area_vis) {
                ts_area_vis = true;
                $( "#timestamp_area" ).fadeIn();
            }
        } else {
            if (ts_area_vis) {
                ts_area_vis = false;
                $( "#timestamp_area" ).fadeOut();
            }
            saved_shortlink = false;
        }

        // Handle whole request error code
        var err_code = res[5];
        if (err_code !== 200) {
            if (!handle_error(res, err_code)) {
                $( ".orb_load_ring" ).css("visibility", "hidden");
                handle_summoner_codes(res);
                return;
            }
        }

        // if (err_code === 200) {
        if ((errored || $( "#status_area" ).css("opacity") == 1) && err_code === 200) {
            errored = false;
            $( "#status_area" ).fadeOut(status_fade_duration);
        }

        // Send another request in a few seconds if we are refreshing summoners
        var is_refreshing = false;
        if (res[6] != -1) {
            refreshes = res[6];
            for (var i = 0; i < req_data.length; i++) {
                var rq_i = pl_indices_inv[i];
                if (refreshes[rq_i] === true) {
                    is_refreshing = true;
                    var d = new Date();
                    refresh_ts = d.getTime();
                    waiting_for_refresh = curr_req_i;
                    setTimeout(refresh_request, refresh_sleep_time);
                    break;
                }
            }
        }

        if (!is_refreshing) {
            // Response is valid, store in local cache
            // const hash = get_request_hash(last_preq);
            const hash = last_preq_hash;
            // if (!(hash in request_cache)) {
            cache_store(hash, res);
            // }

        }

        receive_res(res);

        curr_req_disp = req_i;
    }

    function refresh_request() {
        if (recc_pl_i !== -1) {
            setTimeout(refresh_request, 5000);
        }
        if (curr_req_i - waiting_for_refresh > 10) {
            return;
        }
        var d = new Date();
        const t = d.getTime();
        if (t - refresh_ts >= refresh_sleep_time - 100) {
            setTimeout(request_curr_pred, Math.max(0, 7500 - (t - last_req_t)));
        }
    }

    function handle_summoner_codes(res) {
        for (var i = 0; i < req_data.length; i++) {
            var pl = $( "#pl_" + i );
            if (!(i in pl_indices_inv)) {
                pl.find( ".pl_status_text" ).html("");
                pl.find( ".recc_button" ).css('opacity', 1.0);
                pl.find( ".recc_button" ).attr('disabled', false);
                continue;
            }
            code = res[4][pl_indices_inv[i]];
            if (code == -1) {
                pl.find( ".pl_status_text" ).html("");
                pl.find( ".recc_button" ).css('opacity', 1.0);
                pl.find( ".recc_button" ).attr('disabled', false);
            } else if (code == 404) {
                pl.find( ".pl_status_text" ).html("summoner not found");
            } else if(code == 200) {
                pl.find( ".pl_status_text" ).html("&#10004; " + get_pl_perc_str(pl_percs[i]));
                pl.find( ".recc_button" ).css('opacity', 1.0);
                pl.find( ".recc_button" ).attr('disabled', false);
            } else if(code == 201) {
                pl.find( ".pl_status_text" ).html("&#8635; " + get_pl_perc_str(pl_percs[i]) +
                    '<span style="color:#ccc">' + " refreshing..." + '</span>');
                pl.find( ".recc_button" ).css('opacity', 1.0);
                pl.find( ".recc_button" ).attr('disabled', false);
            } else {
                pl.find( ".pl_status_text" ).html("unknown error");
            }
        }
    }

    function get_pl_perc_str(p) {
        return '<span style="color:' + (p > 50.0 ? '#0f0' : (p < 40.0 ? '#ff9933' : '#ff0')) + '">' + p + '%</span>';
    }

    function handle_error(res, err_code) {
        var res = false;
        if (err_code == 500) {
            $( "#warning_text" ).html("Server error");
            $( "#warning_subtext" ).html("");
        } else if (err_code == 404) {
            $( "#warning_text" ).html("Error 404");
            $( "#warning_subtext" ).html("shortlink not found");
        } else if (err_code == 201) {
            $( "#warning_text" ).html("More data needed");
            $( "#warning_subtext" ).html("low accuracy model");
            res = true;
        } else if (err_code == 300) {
            $( "#warning_text" ).html("More data needed");
            var prof_count = 0;
            for (var i = 0; i < req_data.length; i++) {
                if (req_data[i][name_li] != -1) {
                    prof_count++;
                }
            }
            if (prof_count == 0) {
                $( "#warning_subtext" ).html("summoner(s) not found");
            } else if (prof_count == 1) {
                $( "#warning_subtext" ).html("summoner not found");
            } else {
                $( "#warning_subtext" ).html("summoners not found");
            }
        } else {
            $( "#warning_text" ).html("unknown error " + err_code);
            $( "#warning_subtext" ).html("");
        }
        $( "#status_area" ).fadeIn(status_fade_duration);
        errored = true;
        return res;
    }

    $( "#share_copy_button" ).click(function() {
        $( "#share_input" ).select();
        document.execCommand("copy");
        $( "#share_suff_text" ).html("&#10004;");
        if (!saved_shortlink) {
            saved_shortlink = true;

        }
    });

    // Refresh prediction button
    $( "#refresh_button" ).click(function() {
        setTimeout(request_curr_pred, 0);
    });

    // Pick recommendation button
    const bottom_role_index = roles_opts_lower.indexOf('bottom') - 1;
    const support_role_index = roles_opts_lower.indexOf('support') - 1;
    var recc_pl_i = -1;
    var recc_pl_vis = false;
    $( ".recc_button" ).click(function() {
        if (recc_pl_i !== -1 || curr_req_disp < curr_req_i - 1) {
            return;
        }
        var pl = $( this ).parent();
        var pl_id = pl.attr("id");
        var pl_i = parseInt(pl_id[pl_id.length - 1]);
        recc_pl_i = pl_i;

        // Prepare and send recommendations request
        var rq = clone_2d_arr(req_data);
        rq[pl_i][cid_li] = -2;

        // Set div position, visibility and label text
        var recc_cont = $( "#recc_cont" );
        recc_cont.css("left", parseInt(pl.css('left')));
        recc_cont.css("top", parseInt(pl.css('top')) + pl_height - 2);
        $( "#recc_outer_area" ).css('visibility', 'hidden');
        $( ".recc_champion_ch" ).css('visibility', 'hidden');
        $( ".recc_champion_pl" ).css('visibility', 'hidden');
        $( "#recc_loader" ).css('visibility', 'visible');

        // Set left label text
        var role_i = rq[pl_i][role_li];
        var role_is_bottom = role_i === bottom_role_index;
        var role_is_support = role_i === support_role_index;
        var bot_lane_role = role_is_bottom || role_is_support;
        var left_label_text = 'for ' + roles_opts_lower[role_i + 1];
        // If lane opponent exists for role
        const team_i = 1 - rq[pl_i][team_li];
        var opp_bottom = -1;
        var opp_support = -1;
        for (var i = 0; i < 10; i++) {
            if (!bot_lane_role) {
                if (rq[i][team_li] === team_i && rq[i][role_li] === role_i) {
                    var cid = rq[i][cid_li];
                    if (cid !== -1) {
                        left_label_text += '<br />vs. ' + champ_list[champ_ind_dict[cid]][ch_name_li].toLowerCase();
                    }
                    break;
                }
            } else {
                if (rq[i][team_li] === team_i) {
                    if (rq[i][role_li] === bottom_role_index) {
                        opp_bottom = rq[i][cid_li];
                    } else if (rq[i][role_li] === support_role_index) {
                        opp_support = rq[i][cid_li];
                    }
                }
            }
        }
        if (bot_lane_role) {
            if(opp_bottom !== -1 || opp_support !== -1) {
                left_label_text += ' vs.<br />';
                var left_label_suffix = '';
                if(opp_bottom !== -1) {
                    left_label_suffix += champ_list[champ_ind_dict[opp_bottom]][ch_name_li].toLowerCase();
                    if (opp_support !== -1) {
                        left_label_suffix += '/';
                    }
                }
                if (opp_support !== -1) {
                    left_label_suffix += champ_list[champ_ind_dict[opp_support]][ch_name_li].toLowerCase();
                }
                if (left_label_suffix.length > 23) {
                    left_label_suffix = left_label_suffix.slice(0, 24) + '...';
                }
                left_label_text += left_label_suffix;
            }
        }
        $( "#recc_left_label" ).html(left_label_text);

        // Set right label
        var right_label_text = 'for ';
        const pl_name = rq[pl_i][name_li];
        if (pl_name !== -1) {
            right_label_text += pl_name;
            recc_pl_vis = true;
        } else {
            right_label_text += "summoner";
            recc_pl_vis = false;
        }
        $( "#recc_right_label" ).html(right_label_text);

        recc_cont.fadeIn();

        var rq_data = prep_req_data(rq)[0];
        const hash = get_request_hash(rq_data);
        last_preq_recc_hash = hash;
        if (hash in request_cache) {
            cache_load(hash, receive_recc_res);
            return;
        }

        send_pred_req(rq_data, -1, -1, receive_recc_response);
    });

    $( ".recc_champion" ).click(function() {
        var sel_ind = $( this ).attr('cid_i');
        set_new_champion(recc_pl_i, sel_ind);

        $( "#recc_cont" ).fadeOut();
        curr_req_disp = curr_req_i - 1;
        setTimeout(function() {
            recc_pl_i = -1;
        }, 1);
    });
    $( "#recc_cont" ).click( function(e) {
        e.stopPropagation(); // Stop click event from propagating to the container
    });
    $( '#recc_cont' ).mousedown( function(e) {
        e.stopPropagation(); // Stop click event from propagating to the container
    });
    $( '#recc_cont' ).mouseup( function(e) {
        e.stopPropagation(); // Stop click event from propagating to the container
    });

    function receive_recc_response(res, status) { // reccurr
        // res = JSON.parse(res); // Already parsed because content type = application/json
        if (status === "success") {
            var req_i = res[3];
            // if (req_i >= curr_req_disp) {
            // if (req_i >= curr_req_i - 5) {
            if (req_i >= curr_req_i - 1) {
                if (res[0] == -1 || res[0][0] == -1) {
                    console.log("Recommendations request failed (-1)");
                }
                // Success!
                // curr_req_disp = req_i;
            } else {
                return;
            }
        } else {
            console.log("Recommendations request failed with status: " + status);
            console.log(res);
        }

        // Handle request error code
        var err_code = res[5];
        if (err_code < 200 || err_code >= 300) {
            console.log("Recommendations request failed with server error " + err_code);
            console.log(res);
            return;
        }

        const hash = last_preq_recc_hash;
        cache_store(hash, res);

        receive_recc_res(res);
    }

    function receive_recc_res(res) {

        // var pl = $( "#pl_" + recc_pl_i );

        // Set results
        var recc_res = res[0];
        var recc_res_ch = res[1];
        if (recc_res_ch !== -1) {
            recc_pl_vis = true;
        }
        var inv = (req_data[recc_pl_i][team_li] === 1);
        var i_ = -1;
        for (var i = 0; i < recc_res.length; i++) {
            var j = i;
            if (!inv) {
                j = recc_res.length - 1 - i;
            }
            var perc = recc_res[j][0];
            var cid = recc_res[j][1];
            if (perc === -1) {
                $( "#recc_pl_" + cid ).css('display', 'none');
                $( "#recc_ch_" + cid ).css('display', 'none');
                continue;
            } else if (inv) {
                perc = 100 - perc;
            }
            i_++;
            $( "#recc_pl_" + cid ).css('display', 'block');
            $( "#recc_ch_" + cid ).css('display', 'block');
            var typ = 'ch';
            if (recc_pl_vis) {
                typ = 'pl';
                var perc_ch = recc_res_ch[j][0];
                var cid_ch = recc_res_ch[j][1];
                if (inv) {
                    perc_ch = 100 - perc_ch;
                }
                $( "#recc_ch_" + cid_ch ).css('top', (i_ * 18) + 'px');
                $( "#recc_ch_" + cid_ch + "_perc" ).html(perc_ch.toFixed(1) + '%');
                // $( "#recc_pl_" + cid ).css('visibility', 'visible');
            }
            // } else {
            //     typ = 'ch';
            //     // $( "#recc_pl_" + cid ).css('visibility', 'hidden');
            // }
            $( "#recc_" + typ + '_' + cid ).css('top', (i_ * 18) + 'px');
            $( "#recc_" + typ + '_' + cid + "_perc" ).html(perc.toFixed(1) + '%');
        }
        $( "#recc_loader" ).css('visibility', 'hidden');
        $( "#recc_outer_area" ).css('visibility', 'visible');
        $( ".recc_champion_ch" ).css('visibility', 'visible');
        $( ".recc_champion_pl" ).css('visibility', recc_pl_vis ? 'visible' : 'hidden');
    }

    // Define procedure for changing a role
    $( ".role_select" ).change(function() {
        var pl_id = $( this ).parent().parent().attr("id");
        var pl_i = parseInt(pl_id[pl_id.length - 1]);
        var prev_ropt = pl_ropts[pl_i];
        var ropt = $( this )[0].selectedIndex;
        if (prev_ropt != ropt) {
            if (ropt !== 0 && prev_ropt === 0) {
                $( this ).css('color', '#fff');
                $( this ).find(".role_option_0").html("auto assign");
            } else if (ropt === 0 && prev_ropt !== 0) {
                $( this ).css('color', '#888');
            }
            pl_ropts[pl_i] = ropt;

            var role = ropt - 1;
            var prev_role = prev_ropt - 1;
            var prev_pl_i;

            // Check if a summoner already has the role
            // If on left side team
            var side = 1;
            if (  (req_data[pl_i][team_li] === 0 && left_col == "blue") || 
                  (req_data[pl_i][team_li] === 1 && left_col == "red")) {
                side = 0;
            }
            // If previously we had an actual role selected
            if (prev_ropt > 0) {
                rdict[side][prev_role] = -1;
            }
            // If user selected an actual role (not auto assign)
            if (ropt > 0) {
                // pl_roles[pl_i] = role;
                req_data[pl_i][role_li] = role;
                
                prev_pl_i = rdict[side][role];
                rdict[side][role] = pl_i;
                if (prev_pl_i !== -1) { // If the role was previously taken
                    if (prev_role >= 0) { // If this player previously had a role
                        rdict[side][prev_role] = prev_pl_i; // Set previously taken slot to this role
                        pl_ropts[prev_pl_i] = prev_ropt;
                        // pl_roles[prev_pl_i] = prev_role;
                        req_data[prev_pl_i][role_li] = prev_role;
                    } else {
                        pl_ropts[prev_pl_i] = 0; // Else set previously taken slot to auto assign
                        rdict[side][prev_role] = -1;
                    }
                    prev_new_ropt = pl_ropts[prev_pl_i];
                    $( "#pl_" + prev_pl_i ).find(".role_cont").find(".role_select")[0].selectedIndex = prev_new_ropt;
                    if (prev_new_ropt !== 0 && ropt === 0) {
                        $( "#pl_" + prev_pl_i ).find(".role_cont").find(".role_select").css('color', '#fff');
                    } else if (prev_new_ropt === 0 && ropt !== 0) {
                        $( "#pl_" + prev_pl_i ).find(".role_cont").find(".role_select").css('color', '#888');
                    }
                }
            }

            auto_assign_roles();
            setTimeout(request_curr_pred, 0);
        }
    });

    // Define champion grid triggers
    $( ".grid_button" ).click(function() { // Make grid appear
        // $("#champion_grid_cont").toggleClass("hide");
        // $("#champion_grid_cont").toggleClass("show");
        $( "#champion_grid_cont" ).css("visibility", "visible");

        var pl_id = $( this ).parent().parent().attr("id");

        // Set the current pl_i for editing the selected champion
        ch_pl_i = parseInt(pl_id[pl_id.length - 1]);

        // Highlight the currently selected champion in the grid
        const curr_img_id = 'grid_img_' + selected_ch_indices[ch_pl_i];
        $( "#" + curr_img_id ).addClass("grid_img_selected");
    });

    $( "#champion_grid_cont" ).click(function() { // Make grid disappear
        // $(this).toggleClass("show");
        // $(this).toggleClass("hide");
        $(this).css("visibility", "hidden");

        const curr_img_id = 'grid_img_' + selected_ch_indices[ch_pl_i];
        $( "#" + curr_img_id ).removeClass("grid_img_selected");
    });

    $( ".grid_img" ).click(function(event) { // Make grid disappear after setting new champion
        event.stopPropagation(); // Stop click event from propagating to the container
        // $("#champion_grid_cont").toggleClass("show");
        // $("#champion_grid_cont").toggleClass("hide");
        $("#champion_grid_cont").css("visibility", "hidden");

        const current_i = selected_ch_indices[ch_pl_i];

        var sel_ind = $(this).attr("id").split('_');
        sel_ind = parseInt(sel_ind[sel_ind.length - 1]);
        const new_cid = champ_list[sel_ind][ch_cid_li];
        const old_cid = req_data[ch_pl_i][cid_li];

        if (new_cid != old_cid) {
            const curr_img_id = 'grid_img_' + current_i;
            $( "#" + curr_img_id ).removeClass("grid_img_selected");
        }

        set_new_champion(ch_pl_i, sel_ind);
    });

    function set_new_champion(pl_i, sel_ind) {
        const current_i = selected_ch_indices[pl_i];
        selected_ch_indices[pl_i] = sel_ind;
        const new_cid = champ_list[sel_ind][ch_cid_li];
        const old_cid = req_data[pl_i][cid_li];

        if (new_cid != old_cid) {
            const curr_img_id = 'grid_img_' + current_i;
            $( "#" + curr_img_id ).removeClass("grid_img_selected");
        }

        if (new_cid != old_cid) {
            req_data[pl_i][cid_li] = new_cid;
            if (sel_ind > 0) {
                // If there is another entry with the same champion, switch champions with that player
                for (var i = 0; i < 10; i++) {
                    if (i == pl_i) {
                        continue;
                    }
                    if (req_data[i][cid_li] == new_cid) {
                        req_data[i][cid_li] = old_cid;
                        old_sel_ind = champ_ind_dict[old_cid];
                        selected_ch_indices[i] = old_sel_ind;
                        if (old_cid != -1) {
                            $( '#pl_' + i ).find( '.champion_box' ).css(
                                "background-image", 'url(' + ddrag_url + 
                                    champ_list[old_sel_ind][ch_id_li] + '.png)');
                        } else {
                            $( '#pl_' + i ).find( '.champion_box' ).css(
                                "background-image", 'url(' + none_champ_img + ')');
                        }
                        break;
                    }
                }
                $( '#pl_' + pl_i ).find( '.champion_box' ).css(
                    "background-image", 'url(' + ddrag_url + champ_list[sel_ind][ch_id_li] + '.png)');
            } else {
                $( '#pl_' + pl_i ).find( '.champion_box' ).css(
                    "background-image", 'url(' + none_champ_img + ')');
            }

            auto_assign_roles();
            setTimeout(request_curr_pred, 0);
        }
    }

    function update_expected_lp() {
        $( "#lp_w_perc" ).html(Math.round(curr_perc));
        $( "#lp_l_perc" ).html(100 - Math.round(curr_perc));
        const frac = curr_perc / 100.0;
        const exp_lp = Math.round(((frac * win_lp) - ((1.0 - frac) * loss_lp)) * 10) / 10;
        const col = exp_lp < 0 ? '#ff9933' : (exp_lp > 0 ? '#0f0' : "#fff");
        const prefix = exp_lp > 0 ? '+' : '';
        $( "#lp_expected" ).html('<span style="color:' + col + ';">' + prefix + exp_lp + '</span>');
    }

    $( "#win_lp_input" ).on('input', function() {
        var w_lp = null;
        try {
            w_lp = parseInt($( this ).val());
            if (!isNaN(w_lp)) {
                win_lp = w_lp;
                Cookies.set("wl_lp", [win_lp, loss_lp]);
            }
        } catch (err) {
            console.log(err);
        }
        update_expected_lp();
    });
    $( "#loss_lp_input" ).on('input', function() {
        var l_lp = null;
        try {
            l_lp = parseInt($( this ).val());
            if (!isNaN(l_lp)) {
                loss_lp = l_lp;
                Cookies.set("wl_lp", [win_lp, loss_lp]);
            }
        } catch (err) {
            console.log(err);
        }
        update_expected_lp();
    });

    $( "#undo_button" ).click(function() {
        var comp_cookie = Cookies.getJSON('match_composition_previous');
        if (typeof comp_cookie != 'undefined') {
            if(load_comp(comp_cookie)) {
                setTimeout(request_curr_pred, 0);
            }
        }
    });

    $( "#clear_button_all" ).click(function() {
        initialise_vars();
        for (var i = 0; i < 10; i++) {
            var pl = $( "#pl_" + i );

            // Reset role
            var r_sel = pl.find( ".role_cont" ).find( ".role_select" )
            r_sel[0].selectedIndex = 0;
            r_sel.find(".role_option_0").html("auto assign");
            // r_sel.find(".role_option_0").css('color', '#888');
            r_sel.css('color', '#888');
            // Reset name
            pl.find( ".name_cont" ).find( ".name_input" ).val('')
            pl.find( ".pl_status_text" ).html("");
            set_opgg_link(pl, '');
            // Reset champion
            pl.find( '.champion_box' ).css(
                    "background-image", 'url(' + none_champ_img + ')');
        }
        $( "#perc_text" ).css("color", "#999");
        $( ".j_perc" ).css("color", "#999");
        $( "#perc_warning_symb" ).fadeOut();
        $( "#status_area" ).fadeOut(status_fade_duration);
        reset_everything();
    });

    $( "#clear_button_l" ).click(function() {
        clear_team(0);
    });

    $( "#clear_button_r" ).click(function() {
        clear_team(1);
    });

    function clear_team(team_i) {

        curr_req_i += 1000;
        pl_indices = {};
        pl_indices_inv = {};
        waiting_for_refresh = -1;
        selected_ch_indices = [...Array(10).keys()].map(i => 0);

        for (var i = 0; i < 10; i++) {
            var pl = $( "#pl_" + i );

            const l_team = (req_data[i][team_li] === 0 && left_col == "blue") ||
                           (req_data[i][team_li] === 1 && left_col == "red");

            if (team_i === 0 ? l_team : !l_team ) {

                // Reset role vars
                var r = pl_ropts[i];
                if (r > 0) {
                    rdict[team_i][r - 1] = -1;
                    pl_ropts[i] = 0;
                }
                // Reset name vars
                req_data[i][name_li] = -1;
                // Reset champion vars
                req_data[i][cid_li] = -1;

                // Reset role
                var r_sel = pl.find( ".role_cont" ).find( ".role_select" )
                r_sel[0].selectedIndex = 0;
                // r_sel.find(".role_option_0").css('color', '#888');
                r_sel.css('color', '#888');
                // Reset name
                pl.find( ".name_cont" ).find( ".name_input" ).val('')
                pl.find( ".pl_status_text" ).html("");
                set_opgg_link(pl, '');
                // Reset champion
                pl.find( '.champion_box' ).css(
                        "background-image", 'url(' + none_champ_img + ')');
            }
        }
        auto_assign_roles();

        for (var i = 0; i < 10; i++) {
            var pl = $( "#pl_" + i );

            const l_team = (req_data[i][team_li] === 0 && left_col == "blue") ||
                           (req_data[i][team_li] === 1 && left_col == "red");

            if (team_i === 0 ? l_team : !l_team ) {
                pl.find( ".role_cont" ).find( ".role_select" ).find(".role_option_0").html("auto assign");
            }

        }
        setTimeout(request_curr_pred, 0);
    }

    $( "#clear_ch_button_l" ).click(function() {
        clear_champions(0);
    });

    $( "#clear_ch_button_r" ).click(function() {
        clear_champions(1);
    });

    function clear_champions(team_i) {

        curr_req_i += 1000;
        pl_indices = {};
        pl_indices_inv = {};
        waiting_for_refresh = -1;
        selected_ch_indices = [...Array(10).keys()].map(i => 0);

        for (var i = 0; i < 10; i++) {
            var pl = $( "#pl_" + i );

            const l_team = (req_data[i][team_li] === 0 && left_col == "blue") ||
                           (req_data[i][team_li] === 1 && left_col == "red");

            if (team_i === 0 ? l_team : !l_team ) {

                // Reset champion vars
                req_data[i][cid_li] = -1;

                // Reset champion
                pl.find( '.champion_box' ).css(
                        "background-image", 'url(' + none_champ_img + ')');
            }
        }
        auto_assign_roles();
        setTimeout(request_curr_pred, 0);
    }

    $( "#clear_pl_button_l" ).click(function() {
        clear_summoners(0);
    });

    $( "#clear_pl_button_r" ).click(function() {
        clear_summoners(1);
    });

    function clear_summoners(team_i) {

        curr_req_i += 1000;
        pl_indices = {};
        pl_indices_inv = {};
        waiting_for_refresh = -1;

        for (var i = 0; i < 10; i++) {
            var pl = $( "#pl_" + i );

            const l_team = (req_data[i][team_li] === 0 && left_col == "blue") ||
                           (req_data[i][team_li] === 1 && left_col == "red");

            if (team_i === 0 ? l_team : !l_team ) {

                // Reset name vars
                req_data[i][name_li] = -1;

                // Reset name
                pl.find( ".name_cont" ).find( ".name_input" ).val('')
                pl.find( ".pl_status_text" ).html("");
                set_opgg_link(pl, '');
            }
        }
        auto_assign_roles();
        setTimeout(request_curr_pred, 0);
    }

    // Define champion search show/hide trigger & positioning
    $( ".search_button" ).click(function() {

        var dropdown_elem = $( ".search_dropdown" );
        dropdown_elem.toggleClass("hide");
        // dropdown_elem.toggleClass("show");
        var pl_id = $( this ).parent().parent().attr("id");
        var pl_i = parseInt(pl_id[pl_id.length - 1]);

        // if dropdown is already open for a different player
        if (!dropdown_elem.hasClass("hide")) {

        // if (!dropdown_elem.hasClass("hide")) {

            // Set the current pl_i for editing the selected champion
            ch_pl_i = pl_i;
            $( ".search_select" )[0].selectedIndex = selected_ch_indices[ch_pl_i];
            $( ".search_select" ).trigger('chosen:updated');
            dropdown_elem.css("left", parseInt($( '#' + pl_id ).css('left')) + 30);
            dropdown_elem.css("top", parseInt($( '#' + pl_id ).css('top')) + pl_height - 5);
            // $( ".search_select" ).trigger("chosen:open"); // Should work but doesn't
            // $( ".search_select" ).trigger("chosen:activate");
            setTimeout(function() {
                $( ".search_select" ).trigger("chosen:open");
            }, 0);
        } else {


        }
    });
    // Initialise chosen select box for champion search
    $( ".chosen-select" ).chosen({no_results_text: "No champions found"});
    $( ".search_dropdown" ).toggleClass("hide");
    // Tell chosen select box to hide itself after a selection is made
    $('.search_select').on('chosen:hiding_dropdown', function(evt, params) {
        var dropdown_elem = $( ".search_dropdown" );
        // dropdown_elem.toggleClass("show");
        dropdown_elem.addClass("hide");

        // At this point, set the new champion id & image
        var sel_ind = $(this)[0].selectedIndex;
        set_new_champion(ch_pl_i, sel_ind);

        const next_pl_i = get_next_pl_i(ch_pl_i);
        if (next_pl_i !== -1) {
            setTimeout(function() {
                var d = new Date();
                const t = d.getTime();
                if (t - last_doc_click > 10) {
                    $( '#pl_' + next_pl_i ).find( ".champion_buttons" ).find( ".search_button" ).click();
                }
            }, 1);
        }
        
    });
    // Search dropdown and document click triggers for deciding to open next player's dropdown
    $( '.search_dropdown' ).click( function(e) {
        e.stopPropagation(); // Stop click event from propagating to the container
        // last_sd_click = true;
        // setTimeout(function() {
        //     last_sd_click = false;
        // }, 200);
    });
    $( '.search_dropdown' ).mousedown( function(e) {
        e.stopPropagation(); // Stop click event from propagating to the container
        // last_sd_click = true;
        // setTimeout(function() {
        //     last_sd_click = false;
        // }, 200);
    });
    $( '.search_dropdown' ).mouseup( function(e) {
        e.stopPropagation(); // Stop click event from propagating to the container
        // last_sd_click = true;
        // setTimeout(function() {
        //     last_sd_click = false;
        // }, 200);
    });
    $( document ).mousedown( function(e) {
        var d = new Date();
        last_doc_click = d.getTime();
    });
    $( document ).mouseup( function(e) {
        var d = new Date();
        last_doc_click = d.getTime();
        if (recc_pl_i !== -1) {
            $( "#recc_cont" ).fadeOut();
            curr_req_disp = curr_req_i - 1;
            setTimeout(function() {
                recc_pl_i = -1;
            }, 1);
        }
    });

    // Get the next on-screen pl_i (top-down, left-right, looping), given the current pl_i
    function get_next_pl_i(pl_i) {
        var plph_id = null;
        var plph_i = 0;
        for (var i = 0; i < 5; i++) {
            var k = "plph_l_" + i;
            if (plph_occupancy[k] == pl_i) {
                // plph_id = k;
                plph_i = i;
            }
        }
        if (plph_id == null) {
            for (var i = 0; i < 5; i++) {
                var k = "plph_r_" + i;
                if (plph_occupancy[k] == pl_i) {
                    // plph_id = k;
                    plph_i = i + 5;
                }
            }
        }
        var next_plph_i = plph_i + 1;
        if (next_plph_i == 10) {
            // next_plph_i = 0;
            return -1;
        }
        var next_plph_col = 'l';
        if (next_plph_i >= 5) {
            next_plph_col = 'r';
            next_plph_i -= 5;
        }
        const next_plph_id = "plph_" + next_plph_col + '_' + next_plph_i;
        return plph_occupancy[next_plph_id];
    }

    // Define player name input text box enter key action
    $( '.name_input' ).on('keyup', function(e) {
        var name = $( this ).val();
        set_opgg_link($( this ).parent().parent(), name);
    });
    $( '.name_input' ).on('keypress', function(e) {
        var name = $( this ).val();
        // set_opgg_link($( this ).parent().parent(), name);
        if (e.which === 13) { // 13 = the enter key
            var pl_id = $( this ).parent().parent().attr("id");
            var pl_i = parseInt(pl_id[pl_id.length - 1]);
            if (name != conv_name(req_data[pl_i][name_li])) {
                req_data[pl_i][name_li] = name;
                if (name == '') {
                    req_data[pl_i][name_li] = -1;
                } else {
                    req_data[pl_i][name_li] = name;
                }
                pl_percs[pl_i] = -1;
                setTimeout(request_curr_pred, 0);
            }
            // Set focus to next name input based on placeholder occupancy
            const next_pl_i = get_next_pl_i(pl_i);
            if (next_pl_i !== -1) {
                $( '#pl_' + next_pl_i ).find( ".name_cont" ).find( ".name_input" ).focus()
            }
        }
    });
    // Define player name unfocus
    $( ".name_input" ).focusout(function() {
        var pl_id = $( this ).parent().parent().attr("id");
        var pl_i = parseInt(pl_id[pl_id.length - 1]);
        var name = $( this ).parent().find( '.name_input' ).val();
        if (name != conv_name(req_data[pl_i][name_li])) {
            req_data[pl_i][name_li] = name;
            if (name == '') {
                req_data[pl_i][name_li] = -1;
            } else {
                req_data[pl_i][name_li] = name;
            }
            pl_percs[pl_i] = -1;
            set_opgg_link($( this ).parent().parent(), name);
            setTimeout(request_curr_pred, 0);
        }
    });
    // Define player name submit button action
    $( ".name_submit" ).click(function() {
        var pl_id = $( this ).parent().parent().attr("id");
        var pl_i = parseInt(pl_id[pl_id.length - 1]);
        var name = $( this ).parent().find( '.name_input' ).val();
        set_opgg_link($( this ).parent().parent(), name);
        if (name != conv_name(req_data[pl_i][name_li])) {
            req_data[pl_i][name_li] = name;
            if (name == '') {
                req_data[pl_i][name_li] = -1;
            } else {
                req_data[pl_i][name_li] = name;
            }
            pl_percs[pl_i] = -1;
            setTimeout(request_curr_pred, 0);
        }
    });
    // Define player name clear button action
    $( ".name_clear" ).click(function() {
        var pl_id = $( this ).parent().parent().attr("id");
        var pl_i = parseInt(pl_id[pl_id.length - 1]);
        var input_box = $( this ).parent().find( '.name_input' )
        var name = input_box.val();
        if (name != '') {
            name = '';
            input_box.val('');
            req_data[pl_i][name_li] = -1;
            pl_percs[pl_i] = -1;
            setTimeout(request_curr_pred, 0);
        }
        set_opgg_link($( this ).parent().parent(), name);
    });

    // Define procedure for changing region, update prediction
    $( "#region_select" ).change(function() {
        set_region(null);
        setTimeout(request_curr_pred, 0);
    });

    function set_region(reg_i) {
        if (reg_i !== null) {
            $( "#region_select" )[0].selectedIndex = reg_i;
            region = reg_i;
        } else {
            region = $( "#region_select" )[0].selectedIndex;
        }
        reg_str = $( "#region_select :selected" ).val();
        for (var i = 0; i < 10; i++) {
            set_opgg_link($( '#pl_' + i ), conv_name(req_data[i][name_li]));
        }
        Cookies.set("region_index", region);
    }

    function set_avg_elo(elo_i) {
        if (elo_i !== null) {
            $( "#elo_select" )[0].selectedIndex = elo_i;
            avg_elo = elo_i;
        } else {
            avg_elo = $( "#elo_select" )[0].selectedIndex;
        }
        Cookies.set("elo_index", avg_elo);
    }

    // Define procedure for average elo change, update prediction
    $( "#elo_select" ).change(function() {
        set_avg_elo(null);
        setTimeout(request_curr_pred, 0);
    });

    // Display winning % option checkbox
    $( "#winning_perc_box" ).change(function() {
        disp_winning_p = $( this ).prop('checked');
        Cookies.set("disp_winning_p", disp_winning_p);

        const disp_enemy_p = disp_winning_p && curr_perc < 50.0;
        const disp_enemy_p_ch = disp_winning_p && curr_perc_ch < 50.0;
        const disp_enemy_p_pl = disp_winning_p && curr_perc_pl < 50.0;
        const number = disp_enemy_p ? 100.0 - curr_perc : curr_perc;
        const number_ch = disp_enemy_p_ch ? 100.0 - curr_perc_ch : curr_perc_ch;
        const number_pl = disp_enemy_p_pl ? 100.0 - curr_perc_pl : curr_perc_pl;

        $( "#perc_text" ).html('' + Math.round(number));
        $( "#champions_perc" ).html('' + Math.round(number_ch));
        $( "#summoners_perc" ).html('' + Math.round(number_pl));
        
        $( "#res_team_col" ).html(disp_enemy_p ? right_col : left_col);
        $( "#res_team_col" ).css('color', disp_enemy_p ? right_text_col : left_text_col);
        $( "#perc_text" ).css('text-shadow', disp_enemy_p ? right_ptxt_shadow_col : left_ptxt_shadow_col)
        $( "#win_text" ).css('text-shadow', disp_enemy_p ? right_ptxt_shadow_col : left_ptxt_shadow_col)
        $( "#perc_symb" ).css('text-shadow', disp_enemy_p ? right_ptxt_shadow_col : left_ptxt_shadow_col)

        $( "#champions_perc_team_col" ).html(disp_enemy_p_ch ? right_col : left_col);
        $( "#champions_perc_team_col" ).css('color', disp_enemy_p_ch ? right_text_col : left_text_col);
        $( "#champions_perc_team_col" ).css('text-shadow', disp_enemy_p_ch ? right_ptxt_shadow_col : left_ptxt_shadow_col);
        $( "#champions_perc" ).css('text-shadow', disp_enemy_p_ch ? right_ptxt_shadow_col : left_ptxt_shadow_col);
        $( "#champions_perc_symb" ).css('text-shadow', disp_enemy_p_ch ? right_ptxt_shadow_col : left_ptxt_shadow_col);

        $( "#summoners_perc_team_col" ).html(disp_enemy_p_ch ? right_col : left_col);
        $( "#summoners_perc_team_col" ).css('color', disp_enemy_p_ch ? right_text_col : left_text_col);
        $( "#summoners_perc_team_col" ).css('text-shadow', disp_enemy_p_ch ? right_ptxt_shadow_col : left_ptxt_shadow_col);
        $( "#summoners_perc" ).css('text-shadow', disp_enemy_p_ch ? right_ptxt_shadow_col : left_ptxt_shadow_col);
        $( "#summoners_perc_symb" ).css('text-shadow', disp_enemy_p_ch ? right_ptxt_shadow_col : left_ptxt_shadow_col);
    });

    // Chat log import methods
    function import_chat_log() {
        var box = $( '#chat_import_input' );
        const inp = box.val();
        box.val('');
        $( "#chat_import_text" ).html("!");
        if (inp === '' || inp === '\n') {
            console.log("empty box");
            return;
        }
        var jtr = joined_lobby_strs[region][lang_i];
        var j_pre = jtr[0];
        var j_post = jtr[1];
        var success = false;
        if (inp.indexOf(j_post) === -1) {

            for (var i = 0; i < region_strs.length; i++) {
                for (var j = 0; j < joined_lobby_strs[i].length; j++) {
                    jtr = joined_lobby_strs[i][j];
                    j_pre = jtr[0];
                    j_post = jtr[1];
                    if (inp.indexOf(j_post) !== -1) {
                        set_region(i);
                        lang_i = j;
                        success = true;
                        break;
                    }
                }
                if (success) {
                    break;
                }
                if (i == region_strs.length - 1) {
                    send_pred_req(prep_req_data(req_data)[0], inp, -9000, undefined);
                    return;
                }
            }
        }
        success = false;
        var j = 0;
        const lines = inp.split('\n').slice(0, 5);
        for (var i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.slice(line.length - j_post.length, line.length) === j_post) {
                const name = line.slice(j_pre.length, line.length - j_post.length).trim();
                const pl_i = plph_occupancy["plph_l_" + j];
                if (req_data[pl_i][name_li] != name) {
                    req_data[pl_i][name_li] = name;
                    pl_percs[pl_i] = -1;
                    $( "#pl_" + pl_i ).find(".name_input").val(name);
                    set_opgg_link($( '#pl_' + pl_i ), conv_name(name));
                }
                success = true;
                j++;
                if (j == 5) {
                    break;
                }
            }
        }
        if (success) {
            if (j < 5) { // If fewer than 5 players found, clear the rest
                for (var k = 4; k >= j; k--) {
                    const pl_i = plph_occupancy["plph_l_" + k];
                    req_data[pl_i][name_li] = -1;
                    pl_percs[pl_i] = -1;
                    $( "#pl_" + pl_i ).find(".name_input").val('');
                    set_opgg_link($( '#pl_' + pl_i ), '');
                }
            }
            $( "#chat_import_text" ).html("&#10004;");
            setTimeout(request_curr_pred, 0);
        } else {
            send_pred_req(prep_req_data(req_data)[0], inp, -9000, undefined);
        }
    }
    $( '#chat_import_input' ).on('keypress', function(e) {
        if (e.which === 13) { // 13 = the enter key
            setTimeout(import_chat_log, 0);
        }
    });
    $( "#chat_import_input" ).bind({ paste : function() {
            setTimeout(import_chat_log, 0);
        }
    });

    // Player draggable definition
    $( ".pl" ).draggable({ snap: ".plph", snapMode: "inner", snapTolerance: 15,
        start: function( event, ui ) {
            // Set z-index to 1000 for the element we're dragging
            ui.helper.css("zIndex", 1000);
        },
        drag: function( event, ui ) {
            // Get i of dragged player
            var pl_id = ui.helper.attr("id");
            var pl_i = parseInt(pl_id[pl_id.length - 1]);

            // If we're on the y grid and x is close enough to
            // the nearest placeholder, snap to that placeholder position
            if (ui.position.top % pl_height == 0) {
                if (Math.abs(ui.position.left) < (pl_width / 35)) {
                    ui.position.left = 0;
                    $( "#pl_" + pl_i ).css('left', 0);
                } else if (Math.abs(ui.position.left - r_pl_x) < (pl_width / 35)) {
                    ui.position.left = r_pl_x;
                    $( "#pl_" + pl_i ).css('left', r_pl_x);
                }
            }
        },
        stop: function( event, ui ) {
            // Get i of dragged player
            var pl_id = ui.helper.attr("id");
            var pl_i = parseInt(pl_id[pl_id.length - 1]);

            // If we're on the y grid and x is close enough to
            // the nearest placeholder, snap to that placeholder position
            if (ui.position.top % pl_height == 0) {
                if (Math.abs(ui.position.left) < (pl_width / 3.0)) {
                    ui.position.left = 0;
                    $( "#pl_" + pl_i ).css('left', 0);
                } else if (Math.abs(ui.position.left - r_pl_x) < (pl_width / 3.0)) {
                    ui.position.left = r_pl_x;
                    $( "#pl_" + pl_i ).css('left', r_pl_x);
                }
            }
            // Figure out which side & placeholder we've snapped to, if any
            var new_side_char = -1;
            var new_side = -1;
            const top_pos = ui.position.top;
            const left_pos = ui.position.left;
            if (top_pos % pl_height == 0 && top_pos >= 0 && top_pos <= pl_height * 4) {
                if (left_pos == 0) {
                    new_side_char = 'l';
                    new_side = 0;
                } else if (left_pos == r_pl_x) {
                    new_side_char = 'r';
                    new_side = 1;
                }
            }

            // If we've snapped to a placeholder
            if (new_side_char != -1) {

                // Set z-index back to default
                ui.helper.css("zIndex", 0);

                // Get current plph_id of dragged player
                const plph_id = ui.helper.attr("plph_id");

                // Figure out what the new plph_id is
                const new_team_plph_i = ui.position.top / pl_height;
                const new_plph_id = "plph_" + new_side_char + '_' + parseInt(Math.round(new_team_plph_i));

                // If the new one is different
                var switched_side = false;
                if (new_plph_id != plph_id) {

                    // Get side_char and team_plph_i of current plph_i
                    const side_char = plph_id[5];
                    const side = (side_char === 'l' ? 0 : 1);
                    const team_plph_i = parseInt(plph_id[plph_id.length - 1]);

                    // Get the pl_i of the player currently at new_plph_id
                    const old_pl_i = plph_occupancy[new_plph_id];

                    // If we swapped with the other team
                    if (side_char != new_side_char) {
                        switched_side = true;

                        // Set new colours
                        req_data[old_pl_i][team_li] = side;
                        req_data[pl_i][team_li] = new_side;

                        // var new_col = req_data[old_pl_i][team_li];
                        // req_data[old_pl_i][team_li] = req_data[pl_i][team_li];
                        // req_data[pl_i][team_li] = new_col;


                        // Set role variables
                        // role = req_data[pl_i][role_li];
                        // old_role = req_data[old_pl_i][role_li];
                        const ropt = pl_ropts[pl_i];
                        const old_ropt = pl_ropts[old_pl_i];
                        const role = ropt - 1;
                        const old_role = old_ropt - 1;
                        if (ropt != old_ropt) { // If roles differ
                            
                            // Set source team roles
                            if (old_ropt > 0) {
                                rdict[new_side][old_role] = -1;

                                const occ_pl_i = rdict[side][old_role];
                                if (occ_pl_i !== -1) {
                                    pl_ropts[occ_pl_i] = 0;
                                    var r_sel = $( "#pl_" + occ_pl_i ).find(".role_cont").find(".role_select")
                                    r_sel[0].selectedIndex = 0;
                                    r_sel.css('color', '#888');
                                }
                                rdict[side][old_role] = old_pl_i;
                            }

                            if (ropt > 0) {
                                rdict[side][role] = -1;

                                // Set destination team roles
                                const occ_pl_i = rdict[new_side][role];
                                if (occ_pl_i !== -1) {
                                    pl_ropts[occ_pl_i] = 0;
                                    var r_sel = $( "#pl_" + occ_pl_i ).find(".role_cont").find(".role_select")
                                    r_sel[0].selectedIndex = 0;
                                    r_sel.css('color', '#888');
                                }
                                rdict[new_side][role] = pl_i;
                            }
                        } else if (ropt > 0) {
                            rdict[side][role] = old_pl_i;
                            rdict[new_side][role] = pl_i;
                        }
                    }

                    // Set new placeholder occupancy
                    plph_occupancy[new_plph_id] = pl_i;
                    plph_occupancy[plph_id] = old_pl_i;
                    ui.helper.attr("plph_id", new_plph_id);
                    $( "#pl_" + old_pl_i ).attr("plph_id", plph_id);

                    if (switched_side) {
                        auto_assign_roles();
                        setTimeout(request_curr_pred, 0);
                    }

                    // Set position of old_pl_i
                    const new_x = (side_char == 'l') ? 0 : r_pl_x;
                    // $( "#pl_" + old_pl_i ).css('left', new_x);
                    // $( "#pl_" + old_pl_i ).css('top', team_plph_i * pl_height);
                    $( "#pl_" + old_pl_i ).css("zIndex", 1000);
                    $( "#pl_" + old_pl_i ).animate({'left': new_x, 'top': team_plph_i * pl_height});
                    $( "#pl_" + old_pl_i ).css("zIndex", 0);
                }
            }
        }
    });
    

    // Try to load match composition from current URL or cookie
    const comp_str = window.location.href.split('?c=');
    var sl_succ = false;
    if (comp_str.length > 1) {
        try {
            const shortlink = comp_str[1];
            send_pred_req(-1, shortlink, -1, receive_curr_pred);
            sl_succ = true;
        } catch (err) {
            console.log("Error importing from shortlink URL: ", err);
        }
    }
    if (!sl_succ) {
        var comp_cookie = Cookies.getJSON('match_composition');
        // if (!(typeof comp_cookie != 'undefined') && load_comp(comp_cookie)) {
        //     comp_cookie = Cookies.getJSON('match_composition_previous');
        //     if (typeof comp_cookie != 'undefined') {
        //         load_comp(comp_cookie);
        //     }
        // }
        if (typeof comp_cookie != 'undefined') {
            load_comp(comp_cookie);
        }
    }


});
// });


