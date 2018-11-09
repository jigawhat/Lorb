// Lorb index javascript

$( function() {

    const status_fade_duration = 300;
    const refresh_sleep_time = 11 * 1000;

    var i = 0;

    $( "#status_area" ).fadeOut(0);

    // $( "#elo_info" ).tooltip({ // Setup tooltip(s)
    //     position: { my: "right top", at: "left bottom", collision: "none", },
    //     relative: true,
    //     // of: $( "#elo_text" ),
    //     // using: function(position, feedback) { $( this ).css(position); } }
    // });

    $( "#home_button" ).click(function() { // Home button
        window.location.href = "";
    });
    $( "#blog_button" ).click(function() { // Blog button
        window.location.href = "blog";
    });
    // $( "#clog_button" ).click(function() { // Changelog button
        // window.location.href = "changelog"
    // });

    // Set region from cookie
    var region = 0;
    var reg_ind_ck = Cookies.get('region_index');
    if (typeof reg_ind_ck != 'undefined') {
        // console.log(reg_ind_ck);
        // console.log(typeof reg_ind_ck);
        try {
            reg_ind_ck = parseInt(reg_ind_ck);
            region = reg_ind_ck;
            $( "#region_select" )[0].selectedIndex = region;
        } catch (err) {
            // console.log(err);
        }
    }

    // Import champion data
    // $.getJSON( , function( data ) {
    // {

    // Constants
    // console.log(champ_data);
    var data = JSON.parse(champ_data);
    var champ_list = data["list"];   // Riot champion data
    var role_aa_order = data["role_fill_order"]; // Order in which to auto assign roles
    var champ_role_is_ordered = data["champ_role_is_ordered"]; // Champion role frequency orderings

    var ch_cid_li = 0; // Indexes of each feature in champ_list
    var ch_id_li = 1;
    var ch_name_li = 2;

    // Create dictionary from indexes to cids
    var champ_ind_dict = {};
    for (i = 0; i < champ_list.length; i++) {
        champ_ind_dict[champ_list[i][ch_cid_li]] = i;
    }

    var ddrag_ver = "8.20.1";
    var ddrag_url = "https://ddragon.leagueoflegends.com/cdn/" + ddrag_ver + "/img/champion/";
    var none_champ_img = "imgs/none_champ.png";
    var roles_opts = ['auto assign', 'top', 'jungle', 'mid', 'support', 'bottom'];
    for (i = 1; i < 6; i++) {
        roles_opts[i] = roles_opts[i].toUpperCase();
    }

    // Champion grid element
    var grid_content = '';
    for (i = 0; i < champ_list.length; i++) {
        var img_url = none_champ_img;
        if (i > 0) {
            img_url = ddrag_url + champ_list[i][ch_id_li] + '.png';
        }
        var c_name = champ_list[i][ch_name_li];
        if (c_name.slice(0, 4) == "None") {
            c_name = "None";
        }
        var extra_style = '';
        if (c_name == "Nunu & Willump") {
            extra_style = 'style="font-size: 6px;" ';
        }
        if (c_name == "Miss Fortune" || c_name == "Tahm Kench" || c_name == "Twisted Fate") {
            extra_style = 'style="font-size: 8px;" ';
        }
        grid_content += '<button style="background-image: url(\'' + img_url +
            '\');" height="60" width="60" class="grid_img" id="grid_img_' + i + '">' + 
            '<span ' + extra_style + 'class="grid_img_text" id="grid_img_text_' + i + '">' +
             c_name + '</span></button>';
    }
    $("body").append($('<div id="champion_grid_cont"><div id="champion_grid">' +
        grid_content + '</div></div>'));

    // Data
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
    var avg_elo = 0;

    const team_li = 0; // Indexes of each feature in req_data
    const role_li = 1;
    const cid_li = 2;
    const name_li = 3;

    // var pl_roles = [0, 1, 2, 3, 4, 0, 1, 2, 3, 4]; // Stores actual roles (0 - 4 inclusive)
    var pl_ropts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // Stores selected role options, (0 means auto-assign)
    var rdict = [{}, {}]; // Inverse dictionary for each team (-1 means auto assign)

    // Request the prediction for the current data & update the displayed result
    var curr_perc = 50;
    var curr_req_i = 0;
    var curr_req_disp = 0;
    var curr_deg = 270;
    var inv_perc = false;
    var pl_indices = {};
    var pl_indices_inv = {};
    var last_req_t = 0;
    var request_curr_pred = function() {
        d = new Date()
        last_req_t = d.getTime()
        // Slim request
        rq_data = [];
        rq_i = 0;
        pl_indices = {};
        pl_indices_inv = {};

        // Fix duplicate roles
        var b_roles_taken = {};
        var r_roles_taken = {};
        var b_fix_roles = [];
        var r_fix_roles = [];
        var b_fr_i = 0;
        var r_fr_i = 0;
        for (i = 0; i < 10; i++) {
            r = req_data[i][role_li];
            if (req_data[i][team_li] === 0) {
                if (r in b_roles_taken) {
                    console.log("Fixing duplicate role: " + i + '-' + r);
                    b_fix_roles[b_fr_i] = i;
                    b_fr_i++;
                } else {
                    b_roles_taken[r] = i;
                }
            } else if (req_data[i][team_li] === 1) {
                if (r in r_roles_taken) {
                    console.log("Fixing duplicate role: " + i + '-' + r);
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
                req_data[i][role_li] = ri;
                $( "#pl_" + i ).find(".role_cont").find(".role_select")[0].selectedIndex = ri;
            }
            if (!(ri in r_roles_taken)) {
                i = r_fix_roles[r_fr_i];
                r_fr_i++;
                req_data[i][role_li] = ri;
                $( "#pl_" + i ).find(".role_cont").find(".role_select")[0].selectedIndex = ri;
            }
        }

        for (i = 0; i < 10; i++) {
            if (req_data[i][cid_li] != -1 || req_data[i][name_li] != -1) {
                rq_data[rq_i] = req_data[i].slice(0, 3);
                rq_data[rq_i][name_li] = ('' + req_data[i][name_li]).trim().slice(0, 16);
                pl_indices[rq_i] = i;
                pl_indices_inv[i] = rq_i;
                rq_i++;
            }
        }
        reset_pl_statuses();
        if (rq_i == 0) {  // Return if we have no input data
            if ((errored || $( "#status_area" ).css("opacity") == 1)) {
                errored = false;
                $( "#status_area" ).fadeOut(status_fade_duration);
            }
            return
        }
        // Send request
        var d = [rq_data, region, avg_elo, curr_req_i];
        $( "#perc_text" ).css("color", "#999");
        $( "#orb_load_ring" ).css("visibility", "visible");
        var server_url = "http://" + document.location.hostname + ":32077";
        curr_req_i++;
        $.post(server_url, JSON.stringify(d), receive_curr_pred, "json");
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

        //         // beforeSend: function (xhr) {
        //         //     xhr.setRequestHeader("Content-Encoding", "gzip");
        //         // },
        //     }
        // );
        // setTimeout(function() {receive_curr_pred(res, "success");}, 200); // Simulate processing time
    };

    var reset_pl_statuses = function() {
        for (i = 0; i < req_data.length; i++) {
            if (req_data[i][name_li] == -1) {
                $( "#pl_" + i ).find( ".pl_status_text" ).html("");
                continue;
            }
            $( "#pl_" + i ).find( ".pl_status_text" ).html("Loading summoner...");
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
        }
    )};

    var errored = false;
    var refresh_ts = 0;
    $( "#status_area" ).css('visibility', 'visible');
    var receive_curr_pred = function(res, status) {
        // res = JSON.parse(res); // Already parsed because content type = application/json
        // console.log(res);
        var perc = curr_perc;
        if (status === "success") {
            var req_i = res[3];
            // if (req_i >= curr_req_disp) {
            // if (req_i >= curr_req_i - 5) {
            if (req_i >= curr_req_i - 1) {
                perc = res[0];
                if (inv_perc) {
                    perc = 100.0 - perc;
                }
                curr_req_disp = req_i;
            }
        } else {
            console.log("Request failed with status: " + status);
            console.log(res)
        }

        // Handle summoner request error codes
        handle_summoner_codes(res);

        // Handle whole request error code
        err_code = res[5];
        if (err_code !== 200) {
            if (!handle_error(res, err_code)) {
                $( "#orb_load_ring" ).css("visibility", "hidden");
                return;
            }
        }
        if ((errored || $( "#status_area" ).css("opacity") == 1) && err_code === 200) {
            errored = false;
            $( "#status_area" ).fadeOut(status_fade_duration);
        }

        // Send another request in a few seconds if we are refreshing summoners
        refreshes = res[6]
        if (refreshes != -1) {
            for (i = 0; i < req_data.length; i++) {
                rq_i = pl_indices_inv[i];
                if (refreshes[rq_i] === true) {
                    var d = new Date();
                    refresh_ts = d.getTime();
                    setTimeout(refresh_request, refresh_sleep_time);
                    break;
                }
            }
        }

        var prev_perc = curr_perc;
        curr_perc = perc;
        var perc_delta = curr_perc - prev_perc;
        var perc_delta_abs = Math.abs(perc_delta);
        // console.log(perc)
        // $( "#perc_text" ).html(perc);
        if (perc_delta_abs > 0) {
            anim_t = ((Math.min(perc_delta_abs, 50) / 50) * 1500) + 400;
            $( "#perc_text" ).prop('number', prev_perc).animateNumber({
                    number: Math.round(perc)
                },
                anim_t,
                'swing',
            );
            var new_deg = 270 + ((180 * ((100 - perc) / 100)) - 90);
            animateRotate($( "#perc_meter" ), curr_deg, new_deg, anim_t, null);
            curr_deg = new_deg;
        };
        if (req_i == curr_req_i - 1) {
            $( "#perc_text" ).css("color", "#fff");
            $( "#orb_load_ring" ).css("visibility", "hidden")
        }
    };
    // Methods to request/receive a prediction for any given data
    // var request_pred = function(d, reg, elo, callback) {
    //     return [70, -1, -1];
    // };
    // var receive_pred = function(data, status) {

    // };

    var refresh_request = function() {
        var d = new Date();
        t = d.getTime();
        if (t - refresh_ts >= refresh_sleep_time - 100) {
            setTimeout(request_curr_pred, Math.max(0, 7500 - (t - last_req_t)))
        }
    }

    var handle_summoner_codes = function(res) {
        for (i = 0; i < req_data.length; i++) {
            if (!(i in pl_indices_inv)) {
                $( "#pl_" + i ).find( ".pl_status_text" ).html("");
                continue;
            }
            code = res[4][pl_indices_inv[i]];
            // console.log(res)
            // console.log(pl_indices_inv[i])
            if (code == -1) {
                $( "#pl_" + i ).find( ".pl_status_text" ).html("");
            } else if (code == 404) {
                $( "#pl_" + i ).find( ".pl_status_text" ).html("Summoner not found");
            } else if(code == 200) {
                $( "#pl_" + i ).find( ".pl_status_text" ).html("&#10004; Loaded");
            } else if(code == 201) {
                $( "#pl_" + i ).find( ".pl_status_text" ).html("&#10004; Loaded (refreshing)");
            } else {
                $( "#pl_" + i ).find( ".pl_status_text" ).html("Unknown error");
            }
        }
    };

    var handle_error = function(res, error_code) {
        res = false;
        if (err_code == 1) {
            $( "#warning_text" ).html("Server error");
            $( "#warning_subtext" ).html("");
        } else if (err_code == 2) {
            $( "#warning_text" ).html("More data needed");
            $( "#warning_subtext" ).html("Low accuracy model");
            res = true;
        } else if (err_code == 3) {
            $( "#warning_text" ).html("More data needed");
            prof_count = 0;
            for (i = 0; i < req_data.length; i++) {
                if (req_data[i][name_li] != -1) {
                    prof_count++;
                }
            }
            if (prof_count == 0) {
                $( "#warning_subtext" ).html("Summoner(s) not found");
            } else if (prof_count == 1) {
                $( "#warning_subtext" ).html("Summoner not found");
            } else {
                $( "#warning_subtext" ).html("Summoners not found");
            }
        } else {
            $( "#warning_text" ).html("Unknown error");
            $( "#warning_subtext" ).html("");
        }
        $( "#status_area" ).fadeIn(status_fade_duration);
        errored = true;
        return res;
    };

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
    for (i = 0; i < 6; i++) {
        pl_inner += '<option value=' + i + ' class="role_option role_option_' + i + '">' + roles_opts[i] + '</option>';
    }
    for (i = 0; i < 5; i++) {
        rdict[0][i] = -1;
        rdict[1][i] = -1;
    }
    pl_inner += '</select></div>' +
        '<div class="name_cont">' + 
        '<input type="text" placeholder="enter summoner" class="name_input" value=""></input>' +
        '<button class="name_clear">&times;</button>' +
        '<button class="name_submit"></button></div>' +
        '<div class="pl_status_text"></div>';

    // Create left side player objects, and all player placeholders
    for (i = 0; i < 5; i++) {
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

    // Set correct initial roles for each player (old code)
    // for (i = 0; i < 5; i++) {
    //     $( "#pl_" + i ).find(".role_cont").find(".role_select")[0].selectedIndex = i;
    //     $( "#pl_" + (i + 5) ).find(".role_cont").find(".role_select")[0].selectedIndex = i;
    // }
    // Define procedure for changing a role
    $( ".role_select" ).change(function() {
        const pl_id = $( this ).parent().parent().attr("id");
        const pl_i = parseInt(pl_id[pl_id.length - 1]);
        const prev_ropt = pl_ropts[pl_i];
        const ropt = $( this )[0].selectedIndex;
        if (prev_ropt != ropt) {
            if (ropt !== 0 && prev_ropt === 0) {
                $( this ).css('color', '#fff');
                $( this ).find(".role_option_0").html("auto assign");
            } else if (ropt === 0 && prev_ropt !== 0) {
                $( this ).css('color', '#888');
            }
            pl_ropts[pl_i] = ropt;

            const role = ropt - 1;
            const prev_role = prev_ropt - 1;
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
                    prev_new_ropt = pl_ropts[prev_pl_i]
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

    // Auto assign roles
    var auto_assign_roles = function() {
        for (side = 0; side < 2; side++) { // For each team
            var side_char = side === 0 ? 'l' : 'r';
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
            for (j = 0; j < 5; j++) {
                var pl_i = plph_occupancy["plph_" + side_char + '_' + j];
                if (pl_ropts[pl_i] === 0) {
                    var cid = req_data[pl_i][cid_li];
                    if (cid !== -1) {
                        champions[cid] = pl_i;
                        // console.log(cid)
                    } else {
                        no_champs_pls[pl_i] = null;
                    }
                }
                // console.log(rdict[side][j]);
                if (rdict[side][j] === -1) {
                    // console.log(j)
                    aa_roles[j] = null;
                }
            }
            // console.log(champions);
            // console.log(Object.keys(aa_roles));
            // console.log(champ_role_is_ordered[68]);
            j = 0;
            champion_inds_mins = [];
            ch_keys = Object.keys(champions);
            for (cid in ch_keys) {
                // cid = parseInt(cid);
                champion_inds_mins[j] = Math.min(champ_role_is_ordered[cid]);
            }
            var sorted_cids = ch_keys
                .map((item, j) => [champion_inds_mins[j], item])
                .sort(([count1], [count2]) => count1 - count2)
                .map(([, item]) => item);
            // console.log(sorted_cids);
            for (let cid of sorted_cids) {
                // console.log(cid);
                ris = Object.keys(aa_roles);
                // console.log(ris);
                ris = ris
                    .map((item, j) => [champ_role_is_ordered[cid][parseInt(item)], item])
                    .sort(([count1], [count2]) => count1 - count2)
                    .map(([, item]) => item);
                // console.log(ris);
                role = ris[0];

                // console.log(role, cid);
                pl_i = champions[cid];
                // console.log(cid, pl_i);
                delete champions[cid];
                delete aa_roles[role];
                role = parseInt(role);
                // pl_roles[pl_i] = role;
                req_data[pl_i][role_li] = role;
                // rdict[side][role] = pl_i;
                $( "#pl_" + pl_i ).find(".role_cont").find(".role_select").find(
                    ".role_option_0").html(roles_opts[role + 1] + " &nbsp(auto assign)");
            }
            // console.log(aa_roles);
            // console.log(no_champs_pls);
            for (var pl_i in no_champs_pls) { // Assign remaining roles in order (no champion info)
                role = parseInt(Object.keys(aa_roles)[0]);
                // if (roles_opts[role + 1] == undefined) {
                //     console.log(role);
                //     console.log(aa_roles);
                // }
                delete aa_roles[role];
                // pl_roles[pl_i] = role;
                req_data[pl_i][role_li] = role;
                // rdict[side][role] = pl_i;
                $( "#pl_" + pl_i ).find(".role_cont").find(".role_select").find(
                    ".role_option_0").html(roles_opts[role + 1] + " &nbsp(auto assign)");
            }
        }
    };

    // Define champion search dropdown box
    var search_dropdown_inner = '<div class="search_dropdown">' +
        '<select data-placeholder="None [unknown]" class="chosen-select search_select" tabindex="1">';
    for (i = 0; i < champ_list.length; i++) {
        ch = champ_list[i];
        search_dropdown_inner += '<option value="' + ch[ch_cid_li] + '">' + ch[ch_name_li] + '</option>';
    }
    search_dropdown_inner += '</select></div>';
    $( "#pl_area" ).append(search_dropdown_inner);

    var ch_pl_i = 0; // Current pl index for which we are selecting a champion
    var selected_ch_indices = [...Array(10).keys()].map(i => 0); // Selected champion list indices for each pl

    // Define champion grid triggers
    $( ".grid_button" ).click(function() { // Make grid appear
        // $("#champion_grid_cont").toggleClass("hide");
        // $("#champion_grid_cont").toggleClass("show");
        $( "#champion_grid_cont" ).css("visibility", "visible");

        var pl_id = $( this ).parent().parent().attr("id");

        // Set the current pl_i for editing the selected champion
        ch_pl_i = parseInt(pl_id[pl_id.length - 1]);

        // Highlight the currently selected champion in the grid
        current_i = selected_ch_indices[ch_pl_i];
        curr_img_id = 'grid_img_' + current_i;
        $( "#" + curr_img_id ).addClass("grid_img_selected");
    });
    $( "#champion_grid_cont" ).click(function() { // Make grid disappear
        // $(this).toggleClass("show");
        // $(this).toggleClass("hide");
        $(this).css("visibility", "hidden");

        var current_i = selected_ch_indices[ch_pl_i];
        var curr_img_id = 'grid_img_' + current_i;
        $( "#" + curr_img_id ).removeClass("grid_img_selected");
    });
    $( ".grid_img" ).click(function(event) { // Make grid disappear after setting new champion
        event.stopPropagation(); // Stop click event from propagating to the container
        // $("#champion_grid_cont").toggleClass("show");
        // $("#champion_grid_cont").toggleClass("hide");
        $("#champion_grid_cont").css("visibility", "hidden");

        var current_i = selected_ch_indices[ch_pl_i];

        var sel_ind = $(this).attr("id").split('_');
        sel_ind = parseInt(sel_ind[sel_ind.length - 1]);
        selected_ch_indices[ch_pl_i] = sel_ind;
        var new_cid = champ_list[sel_ind][ch_cid_li];
        var old_cid = req_data[ch_pl_i][cid_li];

        if (new_cid != old_cid) {
            req_data[ch_pl_i][cid_li] = new_cid;
            if (sel_ind > 0) {
                // If there is another entry with the same champion, switch champions with that player
                for (i = 0; i < 10; i++) {
                    if (i == ch_pl_i) {
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
                $( '#pl_' + ch_pl_i ).find( '.champion_box' ).css(
                    "background-image", 'url(' + ddrag_url + champ_list[sel_ind][ch_id_li] + '.png)');
            } else {
                $( '#pl_' + ch_pl_i ).find( '.champion_box' ).css(
                    "background-image", 'url(' + none_champ_img + ')');
            }

            var curr_img_id = 'grid_img_' + current_i;
            $( "#" + curr_img_id ).removeClass("grid_img_selected");

            auto_assign_roles();
            setTimeout(request_curr_pred, 0);
        }
    });

    // Define team colour switching
    var left_col = "blue";
    var left_text_col = "#636bff";
    var right_col = "red";
    var right_text_col = "#ff5959";
    $( "#l_team_col_text" ).html(left_col);
    $( "#l_team_col_text" ).css("color", left_text_col);
    $( "#r_team_col_text" ).html(right_col);
    $( "#r_team_col_text" ).css("color", right_text_col);
    $( "#res_team_col" ).html(left_col);
    $( "#switch_cols_button" ).click(function() {
        left_col = [right_col, right_col = left_col][0]; // Swap variable values (pre-ES6 compatible)
        left_text_col = [right_text_col, right_text_col = left_text_col][0];
        $( "#l_team_col_text" ).html(left_col);
        $( "#l_team_col_text" ).css("color", left_text_col);
        $( "#r_team_col_text" ).html(right_col);
        $( "#r_team_col_text" ).css("color", right_text_col);
        $( "#res_team_col" ).html(left_col);

        // Change request data values
        for (i = 0; i < 10; i++) {
            req_data[i][0] = 1 - req_data[i][0];
        }
        // Change result percentage for opposite team
        inv_perc = !inv_perc;
        setTimeout(request_curr_pred, 0);
    });

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
            pos_x = parseInt($( '#' + pl_id ).css('left')) + 30;
            pos_y = parseInt($( '#' + pl_id ).css('top')) + pl_height - 5;
            dropdown_elem.css("left", pos_x);
            dropdown_elem.css("top", pos_y);
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
        // console.log(evt)

        // At this point, set the new champion id & image
        var sel_ind = $(this)[0].selectedIndex;
        selected_ch_indices[ch_pl_i] = sel_ind;
        var new_cid = champ_list[sel_ind][ch_cid_li];
        var old_cid = req_data[ch_pl_i][cid_li];

        if (new_cid != old_cid) {
            req_data[ch_pl_i][cid_li] = new_cid;
            if (sel_ind > 0) {
                // If there is another entry with the same champion, switch champions with that player
                for (i = 0; i < 10; i++) {
                    if (i == ch_pl_i) {
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
                $( '#pl_' + ch_pl_i ).find( '.champion_box' ).css(
                    "background-image", 'url(' + ddrag_url + champ_list[sel_ind][ch_id_li] + '.png)');
            } else {
                $( '#pl_' + ch_pl_i ).find( '.champion_box' ).css(
                    "background-image", 'url(' + none_champ_img + ')');
            }

            auto_assign_roles();
            setTimeout(request_curr_pred, 0);
        }

        next_pl_i = get_next_pl_i(ch_pl_i);
        if (next_pl_i !== -1) {
            setTimeout(function () {
                var d = new Date();
                var t = d.getTime();
                if (t - last_doc_click > 10) {
                    $( '#pl_' + next_pl_i ).find( ".champion_buttons" ).find( ".search_button" ).click();
                }
            }, 1);
        }
        
    });
    // Search dropdown and document click triggers for deciding to open next player's dropdown
    $( '.search_dropdown' ).click( function (e) {
        // console.log("THIS");
        e.stopPropagation(); // Stop click event from propagating to the container
        // last_sd_click = true;
        // setTimeout(function() {
        //     last_sd_click = false;
        // }, 200);
    });
    $( '.search_dropdown' ).mousedown( function (e) {
        // console.log("THIS");
        e.stopPropagation(); // Stop click event from propagating to the container
        // last_sd_click = true;
        // setTimeout(function() {
        //     last_sd_click = false;
        // }, 200);
    });
    $( '.search_dropdown' ).mouseup( function (e) {
        // console.log("THIS");
        e.stopPropagation(); // Stop click event from propagating to the container
        // last_sd_click = true;
        // setTimeout(function() {
        //     last_sd_click = false;
        // }, 200);
    });
    $( document ).mousedown( function (e) {
        // console.log("DOC DOWN");
        var d = new Date();
        last_doc_click = d.getTime();
    });
    $( document ).mouseup( function (e) {
        // console.log("DOC UP");
        var d = new Date();
        last_doc_click = d.getTime();
    });

    const conv_name = function (name) {
        if (name === -1) {
            return '';
        }
        return name;
    }

    // Get the next on-screen pl_i (top-down, left-right, looping), given the current pl_i
    const get_next_pl_i = function (pl_i) {
        var plph_id = null;
        var plph_i = 0;
        for (i = 0; i < 5; i++) {
            var k = "plph_l_" + i;
            if (plph_occupancy[k] == pl_i) {
                // plph_id = k;
                plph_i = i;
            }
        }
        if (plph_id == null) {
            for (i = 0; i < 5; i++) {
                var k = "plph_r_" + i;
                if (plph_occupancy[k] == pl_i) {
                    // plph_id = k;
                    plph_i = i + 5;
                }
            }
        }
        next_plph_i = plph_i + 1;
        if (next_plph_i == 10) {
            // next_plph_i = 0;
            return -1;
        }
        next_plph_col = 'l';
        if (next_plph_i >= 5) {
            next_plph_col = 'r';
            next_plph_i -= 5;
        }
        next_plph_id = "plph_" + next_plph_col + '_' + next_plph_i;
        return plph_occupancy[next_plph_id];
    }

    // Define player name input text box enter key action
    $( '.name_input' ).on('keypress', function (e) {
        if (e.which === 13) { // 13 = the enter key
            var pl_id = $( this ).parent().parent().attr("id");
            var pl_i = parseInt(pl_id[pl_id.length - 1]);
            name = $( this ).val();
            if (name != conv_name(req_data[pl_i][name_li])) {
                req_data[pl_i][name_li] = name;
                if (name == '') {
                    req_data[pl_i][name_li] = -1;
                } else {
                    req_data[pl_i][name_li] = name;
                }
                setTimeout(request_curr_pred, 0);
            }
            // Set focus to next name input based on placeholder occupancy
            next_pl_i = get_next_pl_i(pl_i);
            if (next_pl_i !== -1) {
                $( '#pl_' + next_pl_i ).find( ".name_cont" ).find( ".name_input" ).focus()
            }
        }
    });
    // Define player name unfocus
    $( ".name_input" ).focusout(function() {
        var pl_id = $( this ).parent().parent().attr("id");
        var pl_i = parseInt(pl_id[pl_id.length - 1]);
        name = $( this ).parent().find( '.name_input' ).val();
        if (name != conv_name(req_data[pl_i][name_li])) {
            req_data[pl_i][name_li] = name;
            if (name == '') {
                req_data[pl_i][name_li] = -1;
            } else {
                req_data[pl_i][name_li] = name;
            }
            setTimeout(request_curr_pred, 0);
        }
    });
    // Define player name submit button action
    $( ".name_submit" ).click(function() {
        var pl_id = $( this ).parent().parent().attr("id");
        var pl_i = parseInt(pl_id[pl_id.length - 1]);
        name = $( this ).parent().find( '.name_input' ).val();
        if (name != conv_name(req_data[pl_i][name_li])) {
            req_data[pl_i][name_li] = name;
            if (name == '') {
                req_data[pl_i][name_li] = -1;
            } else {
                req_data[pl_i][name_li] = name;
            }
            setTimeout(request_curr_pred, 0);
        }
    });
    // Define player name clear button action
    $( ".name_clear" ).click(function() {
        var pl_id = $( this ).parent().parent().attr("id");
        var pl_i = parseInt(pl_id[pl_id.length - 1]);
        input_box = $( this ).parent().find( '.name_input' )
        name = input_box.val();
        if (name != '') {
            input_box.val('');
            req_data[pl_i][name_li] = -1;
            setTimeout(request_curr_pred, 0);
        }
    });

    // Define procedure for changing region, update prediction
    $( "#region_select" ).change(function() {
        region = $( this )[0].selectedIndex;
        Cookies.set("region_index", region);
        setTimeout(request_curr_pred, 0);
    });

    // Define procedure for average elo change, update prediction
    $( "#elo_select" ).change(function() {
        avg_elo = $( this )[0].selectedIndex;
        setTimeout(request_curr_pred, 0);
    });

    // Chat log import methods
    var jtr = " joined the lobby";
    var import_chat_log = function() {
        box = $( '#chat_import_input' );
        var inp = box.val();
        box.val('');
        $( "#chat_import_text" ).html("!");
        if (inp === '' || inp === '\n') {
            // console.log("empty box");
            return
        }
        if (inp.indexOf(jtr) === -1) {
            // console.log("no jtr found");
            return
        }
        var success = false;
        lines = inp.split('\n').slice(0, 5);
        for (i = 0; i < Math.min(5, lines.length); i++) {
            line = lines[i];
            if (line.slice(line.length - jtr.length, line.length) === jtr) {
                name = line.slice(0, line.length - jtr.length);
                pl_i = plph_occupancy["plph_l_" + i];
                req_data[pl_i][name_li] = name;
                $( "#pl_" + pl_i ).find(".name_input").val(name);
                success = true;
            }
        }
        if (success) {
            $( "#chat_import_text" ).html("&#10004;");
            setTimeout(request_curr_pred, 0);
        }
    };
    $( '#chat_import_input' ).on('keypress', function (e) {
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

            // If we're on the y grid and x is close enough to
            // the nearest placeholder, snap to that placeholder position
            if (ui.position.top % pl_height == 0) {
                if (Math.abs(ui.position.left) < (pl_width / 10)) {
                    ui.position.left = 0;
                } else if (Math.abs(ui.position.left - r_pl_x) < (pl_width / 10)) {
                    ui.position.left = r_pl_x;
                }
            }
        },
        stop: function( event, ui ) {

            // Get i of dragged player
            var pl_id = ui.helper.attr("id");
            var pl_i = parseInt(pl_id[pl_id.length - 1]);

            // Figure out which side & placeholder we've snapped to, if any
            var new_side_char = -1;
            var new_side = -1;
            if (ui.position.top % pl_height == 0) {
                if (ui.position.left == 0) {
                    new_side_char = 'l';
                    new_side = 0;
                } else if (ui.position.left == r_pl_x) {
                    new_side_char = 'r';
                    new_side = 1;
                }
            }

            // If we've snapped to a placeholder
            if (new_side_char != -1) {

                // Set z-index back to default
                ui.helper.css("zIndex", 0);

                // Get current plph_id of dragged player
                plph_id = ui.helper.attr("plph_id");

                // Figure out what the new plph_id is
                new_team_pl_i = ui.position.top / pl_height;
                new_plph_id = "plph_" + new_side_char + '_' + new_team_pl_i;

                // If the new one is different
                if (new_plph_id != plph_id) {

                    // Get side_char and team_pl_i of current plph_i
                    side_char = plph_id[5];
                    side = (side_char === 'l' ? 0 : 1);
                    team_pl_i = parseInt(plph_id[plph_id.length - 1]);

                    // Get the pl_i of the player currently at new_plph_id
                    old_pl_i = plph_occupancy[new_plph_id];

                    // If we swapped with the other team
                    if (side_char != new_side_char) {

                        // Set new colours
                        new_col = req_data[old_pl_i][team_li];
                        req_data[old_pl_i][team_li] = req_data[pl_i][team_li];
                        req_data[pl_i][team_li] = new_col;

                        // Set role variables
                        // role = req_data[pl_i][role_li];
                        // old_role = req_data[old_pl_i][role_li];
                        ropt = pl_ropts[pl_i];
                        old_ropt = pl_ropts[old_pl_i];
                        role = ropt - 1;
                        old_role = old_ropt - 1;
                        if (ropt != old_ropt) { // If roles differ
                            
                            // Set source team roles
                            if (old_ropt > 0) {
                                rdict[new_side][old_role] = -1;

                                const occ_pl_i = rdict[side][old_role];
                                if (occ_pl_i !== -1) {
                                    pl_ropts[occ_pl_i] = 0;
                                    $( "#pl_" + occ_pl_i ).find(
                                        ".role_cont").find(".role_select")[0].selectedIndex = 0;
                                }
                                rdict[side][old_role] = old_pl_i;
                            }

                            if (ropt > 0) {
                                rdict[side][role] = -1;

                                // Set destination team roles
                                const occ_pl_i = rdict[new_side][role];
                                if (occ_pl_i !== -1) {
                                    pl_ropts[occ_pl_i] = 0;
                                    $( "#pl_" + occ_pl_i ).find(
                                        ".role_cont").find(".role_select")[0].selectedIndex = 0;
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

                    if (new_plph_id != plph_id) {
                        auto_assign_roles();
                        setTimeout(request_curr_pred, 0);
                    }

                    // Set position of old_pl_i
                    new_x = (side_char == 'l') ? 0 : r_pl_x;
                    // $( "#pl_" + old_pl_i ).css('left', new_x);
                    // $( "#pl_" + old_pl_i ).css('top', team_pl_i * pl_height);
                    $( "#pl_" + old_pl_i ).css("zIndex", 1000);
                    $( "#pl_" + old_pl_i ).animate({'left': new_x, 'top': team_pl_i * pl_height});
                    $( "#pl_" + old_pl_i ).css("zIndex", 0);
                }
            }
        }
    });
});
// });


