(function (global) {
    var ENDPOINT_QUERY = 'http://pokelive.io/api/data?lat1=51.19473325880419&lat2=51.024017692266746&lng1=16.686121201171886&lng2=17.359033798828136',
        POKE_LANG = require('./data/pokemons.json'),
        config = require('./config.json');

    var request = require("request"),
        _ = require('lodash'),
        chalk = require('chalk'),
        moment = require('moment'),
        fs = require('fs'),
        beep = require('beepbeep');

    var foundPokemons = {};

    checkPokemons();

    function checkPokemons() {
        console.log(chalk.green('Searching...'));
        var wanted = config.wanted,
            sound = config.sound;
        request(ENDPOINT_QUERY, function (error, response, body) {

            if (response.statusCode === 522) {
                console.log(chalk.red('Connection timed out. Trying again...'));
                //setTimeout(checkPokemons, 60000);
                return;
            }

            if (error || response.statusCode !== 200) {
                console.log('Something wrong');
                console.log(error);
                console.log(response.statusCode);
                return;
            }

            var data = JSON.parse(body),
                pokemons = data.pokemons;

            console.log('Found: ' + chalk.green(pokemons.length) + ' pokemons!');

            _.each(pokemons, function (pokemonData) {
                var pokemonName = POKE_LANG[pokemonData.pokemon_id];

                if(_.includes(wanted, pokemonName)) {
                    if (sound) {
                        updateFoundList(pokemonData);
                    }
                    console.log(createMessageOnFound(pokemonData, pokemonName));
                }

            });
        });

        setTimeout(checkPokemons, 30000);
    }

    function updateFoundList(pokemonData) {
        var hash = hashCode(pokemonData.pokemon_id + pokemonData.lat + pokemonData.lng);
        if (_.has(foundPokemons, hash)) {
            releaseFromList();
            return;
        }

        beep(2);
        foundPokemons[hash] = pokemonData;

        releaseFromList();

        function releaseFromList() {
            var currentTime = moment().unix();
            _.each(foundPokemons, function (pokemonData) {
                if (pokemonData.disappear_time < currentTime) {
                    delete foundPokemons[hash];
                    console.log('Release ' + POKE_LANG[pokemonData.pokemon_id] + ' from list!');
                }
            })
        }

        function hashCode() {
            var hash = 0, i = 0, len = this.length, chr;
            while (i < len) {
                hash = ((hash << 5) - hash + this.charCodeAt(i++)) << 0;
            }
            return hash;
        }
    }

    function createMessageOnFound(pokemonData, name) {
        var disappearTime = moment.unix(pokemonData.disappear_time).format("MM/DD/YYYY HH:mm:ss"),
            latitude = pokemonData.lat,
            longtitude = pokemonData.lng;
        return chalk.red(name) + ' at: ' + chalk.yellow(latitude) + ', ' + chalk.yellow(longtitude) +
            ' expired ' + chalk.yellow(disappearTime);
    }
})(this);



